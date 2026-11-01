import authReducer, { setCredentials, logout, updateUser } from "./authSlice";

const initialState = {
  user: null,
  role: null,
  token: null,
  refreshToken: null,
  isAddChild: false,
  isSendInvite: false,
  device_token: null,
  hasSeenWelcome: false,
};

describe("authSlice", () => {
  it("returns the initial state", () => {
    expect(authReducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });

  it("setCredentials stores the user and marks welcome as seen", () => {
    const state = authReducer(
      initialState,
      setCredentials({
        user: { id: 1, username: "jane", email: "jane@example.com" },
        role: "parent",
        token: "access-token",
        refreshToken: "refresh-token",
        isAddChild: false,
        isSendInvite: false,
        device_token: "device-1",
      }),
    );

    expect(state.token).toBe("access-token");
    expect(state.user?.email).toBe("jane@example.com");
    expect(state.hasSeenWelcome).toBe(true);
  });

  it("updateUser merges partial fields without touching the rest", () => {
    const loggedIn = authReducer(
      initialState,
      setCredentials({
        user: { id: 1, username: "jane", email: "jane@example.com" },
        role: "parent",
        token: "access-token",
        refreshToken: "refresh-token",
        isAddChild: false,
        isSendInvite: false,
        device_token: "device-1",
      }),
    );

    const state = authReducer(loggedIn, updateUser({ first_name: "Jane" }));

    expect(state.user?.first_name).toBe("Jane");
    expect(state.user?.email).toBe("jane@example.com");
  });

  it("logout clears the session", () => {
    const loggedIn = authReducer(
      initialState,
      setCredentials({
        user: { id: 1, username: "jane", email: "jane@example.com" },
        role: "parent",
        token: "access-token",
        refreshToken: "refresh-token",
        isAddChild: false,
        isSendInvite: false,
        device_token: "device-1",
      }),
    );

    const state = authReducer(loggedIn, logout());

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});
