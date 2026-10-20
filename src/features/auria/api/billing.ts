import type { ApiSubscriptionResponse } from '../credits';
import { billingHttp } from './http';
import { billingRoutes } from './routes';

/** Plan and balance of the person's workspace for AATOS (E51, on the billing service). */
export const getSubscription = () => billingHttp.get<ApiSubscriptionResponse>(billingRoutes.subscription);
