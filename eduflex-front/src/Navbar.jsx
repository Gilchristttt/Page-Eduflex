import React from "react";
import logo from "./assets/eduflex.png";



function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50 flex justify-center items-center" style={{ height: "220px" }}>
      <img
        src={logo}
        alt="EduFlex Logo"
        style={{ height: "200px", width: "auto" }}
      />
      
    </nav>
  );
}

export default Navbar;


