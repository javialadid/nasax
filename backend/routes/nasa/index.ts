import { Router } from 'express';
import apodRouter from './apod';
import epicRouter from './epic';
import donkiRouter from './donki';
import marsRoversRouter from './marsRovers';
import insightWeatherRouter from './insightWeather';

const router = Router();

router.use('/planetary', apodRouter);
router.use('/EPIC', epicRouter);
router.use('/donki', donkiRouter);
router.use('/mars-photos', marsRoversRouter);
router.use('/', insightWeatherRouter);

export default router; 