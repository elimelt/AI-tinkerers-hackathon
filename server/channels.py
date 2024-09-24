from humanlayer import ContactChannel, SlackContactChannel

dm_with_ceo = ContactChannel(
    slack=SlackContactChannel(
        channel_or_user_id="C03TPB3FVGX",
        context_about_channel_or_user="a DM to order your groceries",
        experimental_slack_blocks=True, #this is the new expiremental feature for slack
    )
)
