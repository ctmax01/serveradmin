export const DOC_TYPES = [
  { id: 1, label: 'Покупка' },
  { id: 2, label: 'Перемещение' },
  { id: 3, label: 'Списание' },
  { id: 4, label: 'Продажа' },
  { id: 5, label: 'Ревизия' },
  { id: 7, label: 'Касса Приход' },
  { id: 8, label: 'Касса Расход' },
  { id: 9, label: 'Начисление' },
  { id: 10, label: 'Корректировка остатков' },
  { id: 13, label: 'Возврат продажи' },
  { id: 17, label: 'Выпуск ГП' },
  { id: 18, label: 'Заявка на закуп' },
  { id: 19, label: 'Возврат покупки' },
  { id: 21, label: 'Перевод / Долг' },
] as const
export const SETTING_GROUPS = [
  {
    label: 'Включено / выключено',
    keys: [
      { key: 'cashDocEnabled', label: 'Касса включена', type: 'bool' },
      { key: 'stockEnabled', label: 'Склад включен', type: 'bool' },
      { key: 'oplataEnabled', label: 'Оплата включена', type: 'bool' },
      { key: 'projectEnabled', label: 'Проект включен', type: 'bool' },
      { key: 'cashTypeEnabled', label: 'Тип кассы включен', type: 'bool' },
      { key: 'userEnabled', label: 'Пользователь включен', type: 'bool' },
      { key: 'currencyEnabled', label: 'Валюта включена', type: 'bool' },
      { key: 'toStockEnabled', label: 'Склад назначения включен', type: 'bool' },
      { key: 'toOplataEnabled', label: 'Оплата назначения включена', type: 'bool' },
      { key: 'toProjectEnabled', label: 'Проект назначения включен', type: 'bool' },
      { key: 'toCurrencyEnabled', label: 'Валюта назначения включена', type: 'bool' },
      { key: 'updateDocItemPrice', label: 'Обновлять цену товара', type: 'bool' },
    ],
  },
  {
    label: 'Видимость полей',
    keys: [
      { key: 'cashDocVisible', label: '👁 Касса видна', type: 'bool' },
      { key: 'cashTypeVisible', label: '👁 Тип кассы виден', type: 'bool' },
      { key: 'stockVisible', label: '👁 Склад виден', type: 'bool' },
      { key: 'currencyVisible', label: '👁 Валюта видна', type: 'bool' },
      { key: 'userVisible', label: '👁 Пользователь виден', type: 'bool' },
      { key: 'oplataVisible', label: '👁 Оплата видна', type: 'bool' },
      { key: 'projectVisible', label: '👁 Проект виден', type: 'bool' },
      { key: 'toStockVisible', label: '👁 Склад назначения виден', type: 'bool' },
      { key: 'toOplataVisible', label: '👁 Оплата назначения видна', type: 'bool' },
      { key: 'toProjectVisible', label: '👁 Проект назначения виден', type: 'bool' },
      { key: 'toCurrencyVisible', label: '👁 Валюта назначения видна', type: 'bool' },
    ],
  },
  {
    label: 'Прочее',
    keys: [{ key: 'defaultDepartment', label: 'Отдел по умолчанию', type: 'number' }],
  },
]

// SETTING_KEYS больше не нужен — берём из групп
export const SETTING_KEYS = SETTING_GROUPS.flatMap((g) => g.keys)
