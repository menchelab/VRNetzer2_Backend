
# # ----------------------------------
# # extract functions from python file 
# # ----------------------------------

# import ast

# def extract_functions_from_file(file_path):
#     """Extract all function names from a given Python file."""
#     with open(file_path, "r") as file:
#         file_content = file.read()
    
#     # Parse the Python file into an Abstract Syntax Tree (AST)
#     tree = ast.parse(file_content)
    
#     # Extract all function definitions
#     return [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]


# # ----------------------------------
# # generate auto mapping 
# # ----------------------------------
# import re

# def convert_to_natural_language(function_name):
#     """Convert a function name to a human-readable, natural language phrase."""
#     # Handle snake_case or camelCase function names
#     words = re.findall(r'[a-zA-Z][^A-Z_]*', function_name)
    
#     # Join the words into a natural phrase and make it lowercase
#     natural_phrase = ' '.join(words).lower()
    
#     # Remove leading underscores (for private functions)
#     natural_phrase = natural_phrase.lstrip('_')
    
#     # Optional: Insert some predefined action verbs for clarity (e.g., 'fetch' for 'get', etc.)
#     if natural_phrase.startswith("get"):
#         natural_phrase = natural_phrase.replace("get", "fetch")
#     elif natural_phrase.startswith("set"):
#         natural_phrase = natural_phrase.replace("set", "update")
#     elif natural_phrase.startswith("delete"):
#         natural_phrase = natural_phrase.replace("delete", "remove")
    
#     return natural_phrase

# def auto_generate_mapping(function_list):
#     """Automatically create a mapping from natural language to function names."""
#     mapping = {}
#     for func in function_list:
#         natural_phrase = convert_to_natural_language(func)
#         mapping[natural_phrase] = func
#     return mapping


# # get functions from file 
# file_path = "analytics.py"  # Replace with the path to your Python file
# functions_in_file = extract_functions_from_file(file_path)

# # Print overview of functions in the file
# print(f"Functions in '{file_path}':")
# for func in functions_in_file:
#     print(f"  - {func}")


# # generate mapping
# auto_mapping = auto_generate_mapping(functions_in_file)

# # Print the generated mapping
# print("Generated Mapping:")
# for natural_phrase, function_name in auto_mapping.items():
#     print(f"'{natural_phrase}' => {function_name}")






# import inspect
# import ast

# def extract_keywords(docstring):
#     keywords = ["open", "show", "create", "visualize", "network", "node"]
#     return [keyword for keyword in keywords if keyword in docstring.lower()]

# def extract_functions_and_keywords(module):
#     functions = inspect.getmembers(module, inspect.isfunction)
#     for func_name, func in functions:
#         docstring = inspect.getdoc(func)
#         # Extract keywords from docstring using NLP or keyword matching
#         keywords = extract_keywords(docstring)
#         yield func_name, docstring, keywords
