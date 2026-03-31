import { NextResponse } from "next/server";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {}),
    },
  });
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: JSON_HEADERS,
    }
  );
}
