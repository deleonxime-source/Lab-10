import React from "react";
import { useAuthContext } from "@asgardeo/auth-react";

function Header() {
  const { state, signIn, signOut } = useAuthContext();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #ddd",
      }}
    >
      <h2>Puppy Manager</h2>

      <div>
        {!state.isAuthenticated && (
          <button
            onClick={() => signIn()}
            style={{
              padding: "0.5rem 1rem",
              cursor: "pointer",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Login
          </button>
        )}

        {state.isAuthenticated && (
          <button
            onClick={() => signOut()}
            style={{
              padding: "0.5rem 1rem",
              cursor: "pointer",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
