def build_user_tree(users):
    user_map = {u["_id"]: {**u, "children": []} for u in users}
    roots = []

    for user in user_map.values():
        manager_id = user.get("reporting_manager")

        if manager_id and manager_id in user_map:
            user_map[manager_id]["children"].append(user)
        else:
            # No manager → top-level (Superadmin / CEO etc.)
            roots.append(user)

    return roots
