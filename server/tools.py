from datetime import datetime
import random
from pydantic import BaseModel, Field
from typing import Annotated, List

from humanlayer.core.approval import HumanLayer
from langchain_core.callbacks import (
    AsyncCallbackManagerForToolRun,
    CallbackManagerForToolRun,
)
from langchain_core.tools import BaseTool
from langchain_core.tools import StructuredTool

from channels import dm_with_ceo
from crud import combined_data_query

hl = HumanLayer()


class CombinedDataInput(BaseModel):
    # skip: int = Field(description="Number of skip records default is 0"),
    # limit: int = Field(description="Number of maximum records default is 100"),
    start: datetime = (
        Field(description="Start datetime for the records. This is required"),
    )
    end: datetime = (
        Field(description="End datetime for the records. This is required"),
    )
    type: List[str] = Field(
        description="List of types of data out of possible types: insulin, sleep, food, exercise, glucose"
    )


class InputData(BaseModel):
    input_data: CombinedDataInput


fetchDataFromQuery = StructuredTool.from_function(
    func=combined_data_query,
    name="FetchDataFromQuery",
    description='Useful for when you need to fetch health data for a particular data source for a given time period. Put all date time in this format "2024-09-12 07:30:00"',
    args_schema=InputData,
    return_direct=False,
)
# Instacart mock calls


class InstacartItem(BaseModel):
    name: str = Field(title="Name of the item")
    quantity: int = Field(title="Quantity of the item")
    price: float = Field(title="Estimated price of the item")


@hl.require_approval(contact_channel=dm_with_ceo)
def get_instacart_order(
    items: Annotated[List[InstacartItem], "List of ingredients to order"]
):
    """
    Returns an instacart grocery order given the desired ingredients. Some may not be available, so ignore the supplied ingredients and only used the ordered items.
    """
    delivery_fee = 5.0
    delivery_estimate = random.randint(15, 45)  # minutes
    total = sum([item.price for item in items]) + delivery_fee

    return {
        "items": items,
        "total": total,
        "eta": delivery_estimate,
    }


getInstacartOrder = StructuredTool.from_function(
    func=get_instacart_order,
    name="getInstacartOrder",
    return_direct=False,
)

# Uber Eats mock calls


class UberEatsItem(BaseModel):
    name: str = Field(title="Name of the item")
    quantity: int = Field(title="Quantity of the item")
    price: float = Field(title="Estimated price of the item")


@hl.require_approval(contact_channel=dm_with_ceo)
def get_uber_eats_order(
    items: Annotated[List[UberEatsItem], "List of food items to order"]
):
    """
    Returns an Uber Eats delivery order given the desired foods. Some may not be available, so only use the ordered items.
    """
    delivery_fee = 5.0
    delivery_estimate = random.randint(15, 45)  # minutes
    total = sum([item.price for item in items]) + delivery_fee

    return {
        "items": items,
        "total": total,
        "eta": delivery_estimate,
    }


getUberEatsOrder = StructuredTool.from_function(
    func=get_uber_eats_order,
    name="getUberEatsOrder",
    return_direct=False,
)
