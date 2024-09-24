from datetime import datetime
from IPython.display import Image, display
from langchain_anthropic import ChatAnthropic
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.messages import HumanMessage
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, START
from langgraph.prebuilt import create_react_agent
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel
from tools import fetchDataFromQuery, getInstacartOrder, getUberEatsOrder

# Set up the tool
# We will have one real tool - a search tool
# We'll also have one "fake" tool - a "ask_human" tool
# Here we define any ACTUAL tools

# # Create the agent
# memory = MemorySaver()
# model = ChatAnthropic(model_name="claude-3-sonnet-20240229")
# tools = [fetchDataFromQuery]
# agent_executor = create_react_agent(model, tools, checkpointer=memory)

# # Use the agent
# config = {"configurable": {"thread_id": "abc123"}}
# for chunk in agent_executor.stream(
#     {
#         "messages": [
#             HumanMessage(
#                 content=f"How much fact-acting insulin have I consumed today? Today's date is {datetime.now()}?"
#             )
#         ]
#     },
#     config,
# ):
#     print(chunk)
#     print("----")

tools = [fetchDataFromQuery, getInstacartOrder, getUberEatsOrder]
tool_node = ToolNode(tools)

model = ChatAnthropic(model="claude-3-5-sonnet-20240620")


class AskHuman(BaseModel):
    """Ask the human a question"""

    question: str


model = model.bind_tools(tools + [AskHuman])


def should_continue(state):
    messages = state["messages"]
    last_message = messages[-1]
    # If there is no function call, then we finish
    if not last_message.tool_calls:
        return "end"
    # If tool call is asking Human, we return that node
    # You could also add logic here to let some system know that there's something that requires Human input
    # For example, send a slack message, etc
    elif last_message.tool_calls[0]["name"] == "AskHuman":
        return "ask_human"
    # Otherwise if there is, we continue
    else:
        return "continue"


def call_model(state):
    messages = state["messages"]
    response = model.invoke(messages)
    # We return a list, because this will get added to the existing list
    return {"messages": [response]}


def ask_human(state):
    messages = state["messages"]
    last_message = messages[-1]
    print(last_message.tool_calls[0]["message"])


from langgraph.graph import END, StateGraph

# Define a new graph
workflow = StateGraph(MessagesState)

# Define the three nodes we will cycle between
workflow.add_node("agent", call_model)
workflow.add_node("action", tool_node)
workflow.add_node("ask_human", ask_human)

workflow.add_edge(START, "agent")

workflow.add_conditional_edges(
    # First, we define the start node. We use `agent`.
    # This means these are the edges taken after the `agent` node is called.
    "agent",
    # Next, we pass in the function that will determine which node is called next.
    should_continue,
    # Finally we pass in a mapping.
    # The keys are strings, and the values are other nodes.
    # END is a special node marking that the graph should finish.
    # What will happen is we will call `should_continue`, and then the output of that
    # will be matched against the keys in this mapping.
    # Based on which one it matches, that node will then be called.
    {
        # If `tools`, then we call the tool node.
        "continue": "action",
        # We may ask the human
        "ask_human": "ask_human",
        # Otherwise we finish.
        "end": END,
    },
)

workflow.add_edge("action", "agent")

# After we get back the human response, we go back to the agent
workflow.add_edge("ask_human", "agent")

# Set up memory

memory = MemorySaver()

# Finally, we compile it!
# This compiles it into a LangChain Runnable,
# meaning you can use it as you would any other runnable
# We add a breakpoint BEFORE the `ask_human` node so it never executes
app = workflow.compile(checkpointer=memory, interrupt_before=["ask_human"])

# display(Image(app.get_graph().draw_mermaid_png()))

config = {"configurable": {"thread_id": "2"}}
system_message = SystemMessage(
    content=f"Your job is to find the relevant data to help the user using an appropriate tool and then take appropriate action items. If the user asks what they should eat you should observe the trends from the past and their glucose levels to suggest similar food items. Fetch data from past two weeks and today's date is Today's date is {datetime.now()}"
)
input_message = HumanMessage(
    content="What should I have for lunch today? And go ahead and order it"
)
for event in app.stream(
    {"messages": [system_message, input_message]}, config, stream_mode="values"
):
    event["messages"][-1].pretty_print()
