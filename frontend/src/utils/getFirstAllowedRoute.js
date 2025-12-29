export const getFirstAllowedRoute = (permissions = [], navItems = []) => {
  const item = navItems.find((item) =>
    item.permissions.some((p) => permissions.includes(p))
  );

  return item ? item.path : "/unauthorized";
};
