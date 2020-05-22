/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {
    IFormGroup,
    ISuperdesk,
    IPropsGenericFormItemComponent,
} from 'superdesk-api';
import {IKnowledgeBaseItem, IKnowledgeBaseItemBase} from './interfaces';
import {getFields} from './GetFields';

export function getAnnotationsLibraryPage(superdesk: ISuperdesk) {
    return class AnnotationsLibraryPage extends React.Component {
        render() {
            const {gettext} = superdesk.localization;
            const {
                getGenericListPageComponent,
                ListItem,
                ListItemColumn,
                ListItemActionsMenu,
            } = superdesk.components;
            const {getFormFieldPreviewComponent} = superdesk.forms;

            const {
                nameField,
                languageField,
                definitionField,
            } = getFields(superdesk);

            const formConfig: IFormGroup = {
                direction: 'vertical',
                type: 'inline',
                form: [
                    nameField,
                    languageField,
                    definitionField,
                ],
            };

            const AnnotationsLibraryPageComponent =
                getGenericListPageComponent<IKnowledgeBaseItem>('concept_items', formConfig);

            class ItemComponent extends React.PureComponent<IPropsGenericFormItemComponent<IKnowledgeBaseItem>> {
                render() {
                    const {item, page} = this.props;

                    return (
                        <ListItem onClick={() => page.openPreview(item._id)}>
                            <ListItemColumn bold noBorder>
                                {getFormFieldPreviewComponent(item, nameField)}
                            </ListItemColumn>
                            <ListItemColumn ellipsisAndGrow noBorder>
                                {getFormFieldPreviewComponent(item, definitionField, {showAsPlainText: true})}
                            </ListItemColumn>
                            <ListItemActionsMenu>
                                <div style={{display: 'flex'}}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            page.startEditing(item._id);
                                        }}
                                        title={gettext('Edit')}
                                    >
                                        <i className="icon-pencil" />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            page.deleteItem(item);
                                        }}
                                        title={gettext('Remove')}
                                    >
                                        <i className="icon-trash" />
                                    </button>
                                </div>
                            </ListItemActionsMenu>
                        </ListItem>
                    );
                }
            }

            return (
                <AnnotationsLibraryPageComponent
                    defaultSortOption={{field: 'name', direction: 'ascending'}}
                    formConfig={formConfig}
                    ItemComponent={ItemComponent}
                    getNewItemTemplate={(page) => {
                        const baseTemplate: Partial<IKnowledgeBaseItemBase> = {
                            cpnat_type: 'cpnat:abstract',
                        };
                        const filteredLanguage = page.getActiveFilters().language;

                        if (filteredLanguage != null) {
                            return {
                                ...baseTemplate,
                                language: filteredLanguage,
                            };
                        } else if (superdesk.instance.config.default_language != null) {
                            return {
                                ...baseTemplate,
                                language: superdesk.instance.config.default_language,
                            };
                        } else {
                            return baseTemplate;
                        }
                    }}
                    fieldForSearch={nameField}
                    defaultFilters={
                        superdesk.instance.config.default_language == null
                            ? {}
                            : {language: superdesk.instance.config.default_language}
                    }
                />
            );
        }
    };
}
