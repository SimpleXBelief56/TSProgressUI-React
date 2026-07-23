import { motion } from "framer-motion";

export default function FooterContent({icon, content, delay}){
    return(
        <motion.div className="content-section" initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 1.5, ease: "easeInOut", delay: delay}}>
            <div className="icon-section">
                {icon}
            </div>
            <div className="text-section">
                <p className="text">{content}</p>
            </div>
        </motion.div>
    );
}