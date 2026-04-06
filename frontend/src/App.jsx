import React from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import Header from "./Header.jsx";
import Body from "./Body.jsx";
import Footer from "./Footer.jsx";

function App() {
  const { state } = useAuthContext();

  if (state.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      {state.isAuthenticated ? <Body /> : <div>Please log in.</div>}
      <Footer />
    </>
  );
}

export default App;
