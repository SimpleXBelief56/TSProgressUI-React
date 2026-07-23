import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/styles.css";
import ValidateTS from "./views/ValidateTS";
import Progress from "./views/Progress";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function App() {
  const [backgroundColor, setBackgroundColor] = useState("linear-gradient(90deg, rgba(27, 27, 31,1) 0%, rgba(27, 27, 31,1) 48%, rgba(27, 27, 31,1) 94%)");

  // useEffect(() => {
  //   setTimeout(() => {
  //     setBackgroundColor(" linear-gradient(90deg, rgba(255,149,0,1) 0%, rgba(255,158,0,1) 48%, rgba(255,188,0,1) 94%)");
  //   }, 2000);
  // }, []);

  return (
    <motion.div animate={{background: backgroundColor}} transition={{duration: 1, ease: "easeInOut"}} style={{background: backgroundColor, transition: "background 1s ease-in-out"}} className="App">
      {/* <NavBar /> */}
      <ValidateTS/>
    </motion.div>
  );
}
