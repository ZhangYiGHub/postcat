import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { kebabCase } from 'lodash-es';

import { SettingService } from '../../../modules/system-setting/settings.service';
import { ThemeVariableService } from './theme-variable.service';
import { SsystemUIThemeType, SYSTEM_THEME, ThemeColors, ThemeItems } from './theme.model';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themes: ThemeItems[] = [];
  /**
   * @description core inject theme,provide baseTheme for extension themes
   */
  private baseThemes = SYSTEM_THEME.filter(val => val.core);
  private module = {
    baseTheme: {
      path: '',
      injectDirection: 'prepend',
      key: 'theme_base', //for storage and id prefix
      default: 'pc' as SsystemUIThemeType
    },
    theme: {
      path: './assets/theme/',
      injectDirection: 'append',
      key: 'theme_core',
      default: 'pc-theme-default'
    }
  };
  /**
   * @description current selected system inject theme
   */
  baseTheme: SsystemUIThemeType;
  /**
   * @description user select color theme
   */
  currentThemeID: string;
  constructor(@Inject(DOCUMENT) private document: Document, private themeVariable: ThemeVariableService, private setting: SettingService) {
    this.baseTheme = this.setting.get('workbench.colorTheme') || this.module.baseTheme.default;
    this.currentThemeID = this.setting.get('workbench.baseTheme') || this.module.theme.default;
  }
  async initTheme() {
    await this.querySystemTheme();
    console.log(this.themes);
    this.injectVaribale(this.themes[0].colors);
  }
  changeTheme(theme) {}
  private getEditorTheme(baseTheme) {
    //Default Theme: https://microsoft.github.io/monaco-editor/index.html
    //'vs', 'vs-dark' or 'hc-black'
    return baseTheme === 'dark' ? 'vs-dark' : 'vs';
  }
  private async querySystemTheme() {
    this.initBaseThemes();
    const defaultTheme = SYSTEM_THEME;
    for (var i = 0; i < defaultTheme.length; i++) {
      const theme = defaultTheme[i];
      let result;
      const systemTheme = this.baseThemes.find(val => val.id === theme.id);
      if (systemTheme) {
        //* Support Offiline,Base theme inject code in index.html
        result = {
          colors: systemTheme.colors
        };
      } else {
        const path = new URL(theme.path, `${window.location.origin}/extensions/core-themes/`).href;
        result = await fetch(path).then(res => res.json());
      }

      this.themes.push({
        title: theme.label,
        id: theme.id,
        baseTheme: theme.baseTheme,
        previewColors: {
          layoutHeaderBackground: '#f8f8fa',
          layoutSiderBackground: '#ffffff',
          bodyBackground: 'rgb(255, 255, 255)',
          border: '#e8e8e8',
          primary: '#00785a'
        },
        ...result
      });
    }
    console.log(this.themes, this.baseThemes);
  }
  private initBaseThemes() {
    this.baseThemes.forEach(theme => {
      const themeColors: Partial<ThemeColors> = theme.customColors;
      //Colors defalut value rule
      theme.colors = this.themeVariable.getColors(themeColors);
    });
  }
  changeEditorTheme(theme?) {
    theme = theme || this.getEditorTheme(this.baseTheme);
    if (window.monaco?.editor) {
      window.monaco?.editor.setTheme(theme);
    }
  }
  private injectVaribale(colors) {
    let variables = '';
    Object.keys(colors).forEach(colorKey => {
      variables += `--${kebabCase(colorKey)}-color:${colors[colorKey]};\n`;
    });
    const content = `
    :root{
       ${variables}
    }
    `;
    let style = document.createElement('style');
    style.innerHTML = content;
    document.getElementsByTagName('head')[0].appendChild(style);
  }
}