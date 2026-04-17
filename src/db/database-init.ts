const buildDatabaseUrl = () => {
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const host = process.env.DB_HOST ?? "localhost";
  const port = process.env.DB_PORT ?? "5432";
  const database = process.env.DB_NAME ?? "";
  const schema = process.env.DB_SCHEMA ?? "public";

  const auth = user
    ? `${encodeURIComponent(user)}${password ? `:${encodeURIComponent(password)}` : ""}@`
    : "";

  return `postgresql://${auth}${host}:${port}/${database}?schema=${schema}`;
};

export { buildDatabaseUrl };