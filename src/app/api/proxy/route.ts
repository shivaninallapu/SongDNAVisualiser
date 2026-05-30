const BACKEND = "http://127.0.0.1:8000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("_path") || "";

  const forwardParams = new URLSearchParams();
  searchParams.forEach((val, key) => {
    if (key !== "_path") forwardParams.append(key, val);
  });

  const url = `${BACKEND}${path}${forwardParams.toString() ? "?" + forwardParams.toString() : ""}`;

  console.log("Proxying to:", url);

  try {
    const res = await fetch(url);
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return Response.json({ error: "Proxy failed" }, { status: 500 });
  }
}