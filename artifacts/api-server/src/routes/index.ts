import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ideasRouter from "./ideas";
import evaluateRouter from "./evaluate";
import startupsRouter from "./startups";
import investorsRouter from "./investors";
import dashboardRouter from "./dashboard";
import threadsRouter from "./threads";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(ideasRouter);
router.use(evaluateRouter);
router.use(startupsRouter);
router.use(investorsRouter);
router.use(dashboardRouter);
router.use(threadsRouter);
router.use(profileRouter);

export default router;
