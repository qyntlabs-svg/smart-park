import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, Store, ChevronRight } from "lucide-react";
import logo from "@/assets/logo.jpg";

const roles = [
  {
    key: "consumer",
    label: "Consumer",
    desc: "Find & book parking spots near you",
    icon: Car,
    route: "/login",
    gradient: "from-primary to-[hsl(4,90%,48%)]",
  },
  {
    key: "vendor",
    label: "Vendor",
    desc: "Manage your parking facility",
    icon: Store,
    route: "/vendor/login",
    gradient: "from-success to-[hsl(160,84%,28%)]",
  },
] as const;

const RoleSelectionScreen = () => {
  const navigate = useNavigate();

  const selectRole = (role: (typeof roles)[number]) => {
    localStorage.setItem("userRole", role.key);
    navigate(role.route, { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 mb-2"
      >
        <div className="w-14 h-14 rounded-2xl overflow-hidden">
          <img src={logo} alt="Auto Doc logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-heading-md text-foreground">Auto Doc</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-body-sm text-muted-foreground mb-10"
      >
        Choose how you'd like to continue
      </motion.p>

      <div className="w-full space-y-4">
        {roles.map((role, i) => (
          <motion.button
            key={role.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => selectRole(role)}
            className="w-full flex items-center gap-4 p-5 bg-card border border-border rounded-2xl shadow-sm text-left"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shrink-0`}>
              <role.icon className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-heading-sm text-foreground">{role.label}</p>
              <p className="text-body-sm text-muted-foreground mt-0.5">{role.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </motion.button>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-10 text-caption text-muted-foreground text-center"
      >
        You can switch roles anytime from settings
      </motion.p>
    </div>
  );
};

export default RoleSelectionScreen;
