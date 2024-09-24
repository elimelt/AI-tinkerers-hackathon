# This example demonstrates how to use the langchain-anthropic library to create an agent
# that can interact with a human to approve actions and deliver updates
#
# based on https://medium.com/@dminhk/langchain-%EF%B8%8F-tool-calling-and-tool-calling-agent-with-anthropic-467b0fb58980
from datetime import datetime

import langchain_core.tools as langchain_tools
from dotenv import load_dotenv
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel

from channels import (
    dm_with_ceo,
)
from humanlayer.core.approval import (
    HumanLayer,
)

load_dotenv()

hl = HumanLayer()

task_prompt = """

You are an order assistant for the user's groceries. The user will be provided with a list
of items that they can order, 
your job is to get the user's approval to order the groceries, and then to place the order.


You can offer to perform  actions like checking the availability of items, or the price of items. If you don't know the price just estimate a random value. Also, if you don't know the availability of an item, just randomly decide and give an alternative.

Example slack dm to send:

Your grocery list for this week is the following: (1) 1 dozen eggs, (2) 1 loaf of multi-grain ezkell bread (3) 1 gallon of whole milk (4) 3 pounds of kale and spinach (5) 2 pound of chicken breast. The total price is $56. 1 loaf of ezkell bread is not available, are you okay with substituting it with a loaf of ezkell whole wheat bread?

Would you like to add anything? If not, can I proceed with ordering this?

"""



class LinkedInMessage(BaseModel):
    from_name: str
    date: str
    message: str


class LinkedInThread(BaseModel):
    thread_id: str
    thread_url: str
    with_name: str
    messages: list[LinkedInMessage]

class GroceryItem(BaseModel):
    name: str
    quantity: int
    price: float

class GroceryList(BaseModel):
    items: list[GroceryItem]
    total_price: float

#@hl.require_approval(contact_channel=dm_with_ceo)
def order_groceries(grocery_list: GroceryList) -> str:
    """order groceries"""
    return f"order successfully placed"


tools = [
    langchain_tools.StructuredTool.from_function(order_groceries),
    langchain_tools.StructuredTool.from_function(
        # allow the agent to contact the CEO
        hl.human_as_tool(
            contact_channel=dm_with_ceo,
        )
    ),
]

llm = ChatAnthropic(model="claude-3-5-sonnet-20240620", temperature=0)

from langchain_core.prompts import ChatPromptTemplate

# Prompt for creating Tool Calling Agent
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful assistant.",
        ),
        ("placeholder", "{chat_history}"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ]
)

# Construct the Tool Calling Agent
agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

if __name__ == "__main__":
    result = agent_executor.invoke({"input": task_prompt})
    print("\n\n----------Result----------\n\n")
    print(result)
