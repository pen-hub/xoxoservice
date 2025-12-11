import { ROLES } from "@/types/enum";

const ROLES_CONFIG: { [key in ROLES]: string[] } = {
  [ROLES.admin]: ["all"],
  [ROLES.sales]: [
    "/customers",
    "/sale",
    "/center"
  ],
  [ROLES.development]: ["all"],
  [ROLES.worker]: [
    "/technician",
    "/center"
  ],
};



export default ROLES_CONFIG;
