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
    label: 'Активен/Не активен',
    keys: [
      { key: 'cashDocEnabled', label: 'Оплата', type: 'bool' },
      { key: 'stockEnabled', label: 'Склад', type: 'bool' },
      { key: 'oplataEnabled', label: 'Оплата', type: 'bool' },
      { key: 'projectEnabled', label: 'Проект', type: 'bool' },
      { key: 'cashTypeEnabled', label: 'Вид расхода', type: 'bool' },
      { key: 'userEnabled', label: 'Пользователь', type: 'bool' },
      { key: 'currencyEnabled', label: 'Валюта', type: 'bool' },
      { key: 'toStockEnabled', label: 'Склад назначения', type: 'bool' },
      { key: 'toOplataEnabled', label: 'Оплата назначения', type: 'bool' },
      { key: 'toProjectEnabled', label: 'Проект назначения', type: 'bool' },
      { key: 'toCurrencyEnabled', label: 'Валюта назначения', type: 'bool' },
    ],
  },
  {
    label: 'Видимость полей',
    keys: [
      { key: 'cashDocVisible', label: 'Касса видна', type: 'bool' },
      { key: 'cashTypeVisible', label: 'Вид расхода виден', type: 'bool' },
      { key: 'stockVisible', label: 'Склад виден', type: 'bool' },
      { key: 'currencyVisible', label: 'Валюта видна', type: 'bool' },
      { key: 'userVisible', label: 'Пользователь виден', type: 'bool' },
      { key: 'oplataVisible', label: 'Оплата видна', type: 'bool' },
      { key: 'projectVisible', label: 'Проект виден', type: 'bool' },
      { key: 'toStockVisible', label: 'Склад назначения виден', type: 'bool' },
      { key: 'toOplataVisible', label: 'Оплата назначения видна', type: 'bool' },
      { key: 'toProjectVisible', label: 'Проект назначения виден', type: 'bool' },
      { key: 'toCurrencyVisible', label: 'Влюта назначения видна', type: 'bool' },
    ],
  },
  {
    label: 'Прочее',
    keys: [
      { key: 'updateDocItemPrice', label: 'Изменять цену товара', type: 'bool' },
      { key: 'defaultDepartment', label: 'Отдел по умолчанию', type: 'number' },
    ],
  },
]

export const SETTING_KEYS = SETTING_GROUPS.flatMap((g) => g.keys)
