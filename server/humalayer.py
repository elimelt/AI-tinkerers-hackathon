from humanlayer import HumanLayer
hl = HumanLayer()
contact_a_human = hl.human_as_tool()
#@hl.require_approval(contact_channel=dm_with_ceo)
def order_groceries(grocery_list: GroceryList) -> str:
    """order groceries"""
    return f"order successfully placed"
    ...

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

# made up method, use whatever
# framework you prefer
run_llm_task(
prompt = """

You are an order assistant for the user's groceries. The user will be provided with a list
of items that they can order, 
your job is to get the user's approval to order the groceries, and then to place the order.


You can offer to perform  actions like checking the availability of items, or the price of items. If you don't know the price just estimate a random value. Also, if you don't know the availability of an item, just randomly decide and give an alternative.

Example slack dm to send:

Your grocery list for this week is the following: (1) 1 dozen eggs, (2) 1 loaf of multi-grain ezkell bread (3) 1 gallon of whole milk (4) 3 pounds of kale and spinach (5) 2 pound of chicken breast. The total price is $56. 1 loaf of ezkell bread is not available, are you okay with substituting it with a loaf of ezkell whole wheat bread?

Would you like to add anything? If not, can I proceed with ordering this?

""",
    tools=[order_groceries, contact_a_human],
    llm=ChatAnthropic(model="claude-3-5-sonnet-20240620", temperature=0)
)