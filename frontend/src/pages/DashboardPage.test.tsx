/**
 * @jest-environment jsdom
 */

import { render, screen, act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import React from "react";

import { DashboardPage } from "./DashboardPage";

import { TestWrapper } from "TestWrapper";

const server = setupServer(
  // getEntities
  http.get("http://localhost/entity/api/v2/", () => {
    return HttpResponse.json({
      count: 3,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          name: "aaa",
          note: "",
          isToplevel: false,
          status: 1,
        },
        {
          id: 2,
          name: "aaaaa",
          note: "",
          isToplevel: false,
          status: 1,
        },
        {
          id: 3,
          name: "bbbbb",
          note: "",
          isToplevel: false,
          status: 1,
        },
      ],
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("should match snapshot", async () => {
  Object.defineProperty(window, "django_context", {
    value: {
      user: {
        is_superuser: false,
      },
    },
    writable: false,
  });

  const result = await act(() => {
    return render(<DashboardPage />, {
      wrapper: TestWrapper,
    });
  });
  await waitFor(() => {
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
  });

  expect(result).toMatchSnapshot();
});
