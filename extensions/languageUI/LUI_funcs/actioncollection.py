
import re
import GlobalData as GD

import flask
from flask_socketio import emit






all_projects_text = '\n'.join(GD.listProjects())


import event_handler.execute_events.drop_down_events as drop_down_events
def action_open_project(project_name):
    """
    Opens a project by its name.
    This function searches for a project with the given name in the list of projects.
    If a matching project is found, it triggers an event to change to that project.
    If no matching project is found, it prints an error message.
    Args:
        project_name (str): The name of the project to open.
    Returns:
        None
    """
    project_name_lower = project_name.lower()
    matching_projects = [proj for proj in GD.listProjects() if proj.lower() == project_name_lower]

    if not matching_projects:
        print(f"ERROR: Project '{project_name}' not found in the project list.")
        
        return

    # Use the project name as it is stored in GD list
    project_name = matching_projects[0]
    
    drop_down_events.trigger_change_project_to(project_name) 
    return f"Project '{project_name}' is now open."


from search import search

def action_show_node_info(node_id):
    """
    Displays information about a specific node.
    This function takes a node ID or node name, searches for the corresponding node information,
    and prints the progress along with the retrieved information.
    Args:
        node_id (int or str): The ID of the node to be searched.
    Returns:
        None
    """

    # search function in search.py
    response = search(str(node_id))
    print("PROGRESS: Showing node information... : ", response)
    return f"Node {node_id} information: {response}"  # Return the response for further use



def action_make_subnetwork(node_id):
    """
    Visualize a subnetwork of nodes with the selected node as the center.

    Args:
        node_id (int): The ID of the node to be used as the center of the subnetwork.

    Returns:
        None
    """
    # Code to visualize a subnetwork of nodes with the selected node as the center
    print("PROGRESS: Making subnetwork...")
    return f"Subnetwork created with node {node_id} at the center."
