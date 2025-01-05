# --------------------------------------------------------------------------------------------------
# Resources 

# Function calling with llms / youtube tutorial with code example 
# https://www.youtube.com/watch?v=p0I-hwZSWMs
# https://github.com/dair-ai/Prompt-Engineering-Guide/blob/main/notebooks/pe-function-calling.ipynb
# --------------------------------------------------------------------------------------------------

import json
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_huggingface import HuggingFaceEndpoint

from langchain.llms import OpenAI

from extensions.languageUI.LUI_funcs.actioncollection import action_open_project, action_show_node_info, action_make_subnetwork


def get_api_token_from_file(file_path="extensions/languageUI/LUI_funcs/HF_token_doNOTcommit.txt"): #OpenAI_token_doNOTcommit.txt"):
    try:
        with open(file_path, "r") as file:
            api_token = file.read().strip()
            if not api_token:
                raise ValueError("Token file is empty. Please ensure the token is correctly set in 'token.txt'.")
            print("Token successfully retrieved from token.txt.")
            return api_token
    except FileNotFoundError:
        raise FileNotFoundError(f"Token file not found at {file_path}. Please create the file and add your token.")
    except Exception as e:
        raise RuntimeError(f"Error reading token file: {str(e)}")




def get_completion_huggingface(messages, model="mistralai/Mistral-7B-Instruct-v0.2", temperature=0, max_tokens=300, tools=None, tool_choice="auto"):
    
    api_token = get_api_token_from_file()
    
    llm = HuggingFaceEndpoint(
        api_key=api_token,
        endpoint_url=f"https://api-inference.huggingface.co/models/{model}",
        tools_list=tools,
        tool_choice=tool_choice
    )
    
    prompt = PromptTemplate(
        input_variables=["messages", "tools"],
    template="""
    You are an assistant that matches user inputs to the most relevant function from the provided tools list. For each user input, select the best tool and provide the following information in a structured format:
    
    1. Function choice: The name of the selected function.
    2. Parameters: A JSON object containing the necessary parameters for the function.
    3. Output: A brief description of what the selected function would do.
    4. Action: A short explanation of why this function was chosen.

    Tools: {tools}
    
    User input: {messages}
    
    Respond strictly in the following format and make it json format:
    
    Function choice: <function_name>
    Parameters: <JSON object>
    Output: <description>
    Action: <explanation>
    """
    )
    
    llm_chain = LLMChain(llm=llm, prompt=prompt)
    
    tools = [
        {
            "type": "function",
            "function": {
                "name": "action_open_project",
                "description": "Opens a project by its exact name. Use this when the input mentions opening a project.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "project_name": {
                            "type": "string",
                            "description": "The name of the project to open.",
                        },
                    },
                    "required": ["project_name"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "action_show_node_info",
                "description": "Shows detailed information about a specific node by its ID.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "node_id": {
                            "type": "string",
                            "description": "The unique ID of the node to retrieve information for.",
                        },
                    },
                    "required": ["node_id"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "action_make_subnetwork",
                "description": "Creates a subnetwork centered on a specific node. Use this when the input mentions creating or visualizing a network.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "node_id": {
                            "type": "string",
                            "description": "The unique ID of the node to center the subnetwork around.",
                        },
                    },
                    "required": ["node_id"],
                },
            },
        },
    ]

    
    response = llm_chain.invoke({"messages": messages, "tools": tools, "tool_choice": tool_choice})    
    return response



