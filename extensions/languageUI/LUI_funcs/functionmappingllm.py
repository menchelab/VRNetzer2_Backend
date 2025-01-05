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





#--------------------------------------------------------------------------------


def get_completion_huggingface(messages, model="mistralai/Mistral-7B-Instruct-v0.2", temperature=0, max_tokens=300, tools=None, tool_choice="auto"):
    
    api_token = get_api_token_from_file()
    
    llm = HuggingFaceEndpoint(
        api_key=api_token,
        endpoint_url=f"https://api-inference.huggingface.co/models/{model}",
        tools_list=tools,
        tool_choice=tool_choice
    )
    
    prompt = PromptTemplate(
        input_variables=["messages"],
        template="""
        You are an assistant that matches functions from tools to user input and returns the output answer and an action chosen based on user input.

        Input: {messages}
        
        Response: 
        "tools": {tools}
        "tool_choice": {tool_choice}
        """
    )
    
    llm_chain = LLMChain(llm=llm, prompt=prompt)
    
  
    tools = [
        {
            "type": "function",
            "function": {
                "name": action_open_project,
                "description": "Opens a project by its name.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "projectname": {
                            "type": "string",
                            "description": "Project to open.",
                        },
                    },
                    "required": ["projectname"],
                },
            },   
        }
    ]

    
    response = llm_chain.invoke({"messages": messages, "tools": tools, "tool_choice": tool_choice})
    print("C_DEBUG: Complete Response received in GET_COMPLETION_HF : ", response)
    
    return response["text"]
#--------------------------------------------------------------------------------







def initialize_llm_chain():
    print("C_DEBUG: Initializing OpenAI LLM Chain with LangChain...")

    api_token = get_api_token_from_file()

    llm = HuggingFaceEndpoint(
        #model_name="mistralai/Mistral-7B-Instruct-v0.2",
        api_key=api_token,
        endpoint_url="https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
    )

    prompt = PromptTemplate(
        input_variables=["question"],
        template="""
        You are an assistant that answers questions.

        Input: {question}
        """
    )

    return LLMChain(llm=llm, prompt=prompt)


def get_response_from_huggingface(question):
    print("C_DEBUG: Getting response from HuggingFace model...")
    
    llm_chain = initialize_llm_chain()
    
    try:
        response = llm_chain.invoke({"question":question})
        print("C_DEBUG: Response received : ", response["text"])
        return response["text"]
    
    except Exception as e:
        print("C_DEBUG: Exception occurred:", str(e))
        return {"status": "error", "message": str(e)}




