import {IDENTITY_KEY, appConfig} from 'appConfig';
import {DEFAULT_ENGLISH_TRANSLATIONS} from 'core/utils';
import {ISuperdeskGlobalConfig, IUser} from 'superdesk-api';

const isTestEnvironment = typeof jasmine !== 'undefined';

/**
 * `config` must be passed explicitly from `init.ts`. The `appConfig` module is evaluated there
 * before `/client_config` is loaded, so it would not include server config like `default_language`.
 * The initial language would then not match the one computed later by `reloadLanguage`,
 * causing an infinite page reload loop.
 */
export function getUserLanguage(config: ISuperdeskGlobalConfig = appConfig): string {
    const user: IUser | null = JSON.parse(localStorage.getItem(IDENTITY_KEY));

    const language =
        user?.language
        ?? localStorage.getItem('LOGGED_OUT_LANGUAGE')
        ?? config.default_language
        ?? window.navigator.language
        ?? 'en';

    return config.profileLanguages?.includes(language) ? language : 'en';
}

function applyTranslations(translations) {
    const language = getUserLanguage();
    const langOverride = appConfig.langOverride ?? {};

    if (langOverride[language] != null) {
        Object.assign(translations, langOverride[language]);
    }

    window.translations = translations;

    if (!isTestEnvironment) {
        window.location.reload();
    }
}

function loadTranslations(language: string) {
    if (language === 'en') {
        applyTranslations(DEFAULT_ENGLISH_TRANSLATIONS);
    } else {
        const translationsUrl = `/languages/${language}.json?nocache=${Date.now()}`;

        fetch(translationsUrl)
            .then((res) => res.json())
            .then((translations) => {
                if (
                    translations[''] == null
                    || translations['']['language'] == null
                    || translations['']['plural-forms'] == null
                ) {
                    throw new Error(`Language metadata not found in "${translationsUrl}"`);
                }

                applyTranslations(translations);
            });
    }
}

// Called after user session is loaded, so if user language has changed,
// UI picks up the latest language from user session
export function reloadLanguage() {
    const newLanguage = getUserLanguage();
    const currentLanguage = window['user-interface-language'];

    if (newLanguage === currentLanguage) {
        return;
    }

    window['user-interface-language'] = newLanguage;

    loadTranslations(newLanguage);
}
