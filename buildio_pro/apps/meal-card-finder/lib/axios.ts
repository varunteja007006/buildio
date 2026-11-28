import axios from "axios";

export const finderClient = axios.create({ timeout: 20000 });
