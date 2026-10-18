export type Lang = 'en' | 'fr' | 'ar';
export const LANGUAGES: Lang[] = ['en', 'fr', 'ar'];
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
export type Params = Record<string, string | number>;
/** A translatable message: lets pure domain code describe text without knowing the language. */
export interface Msg {
  key: string;
  params?: Params;
}
