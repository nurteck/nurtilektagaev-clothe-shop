import rateLimit from 'express-rate-limit';

const jsonMessage = (message: string) => ({ message });

/** Оформление гостевого заказа — не более 5 с одного IP в час */
export const guestOrderCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage(
    'Слишком много заказов с вашего устройства. Подождите около часа или напишите нам в WhatsApp.'
  ),
});

/** Просмотр заказов по телефону */
export const guestOrderLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Слишком много запросов. Попробуйте через несколько минут.'),
});

/** Вход и вход продавца */
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Слишком много попыток входа. Подождите 15 минут.'),
});

/** Регистрация */
export const authRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Слишком много попыток регистрации. Попробуйте позже.'),
});
