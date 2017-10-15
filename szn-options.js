'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  SznElements['szn-options'] = class SznOptions {
    constructor(rootElement, uiContainer) {
      this._uiContainer = uiContainer
      this._ui = null
      this._tether = null
      this._optionsContainer = null
    }

    onMount() {
    }

    setTetherElement(tether) {
      this._tether = tether
    }

    setOptionsContainerElement(container) {
      // TODO: quit observing changes
      this._optionsContainer = container
      // TODO: observe changes
      this._createUI()
    }

    onUnmount() {
      // TODO: quit observing changes, drop UI
    }

    _createUI() {
      if (this._ui) {
        this._ui.parentNode.removeChild(this._ui)
      }

      this._ui = this._makeElement({root: '', hidden: ''},
        this._createOptionGroupOptions(this._optionsContainer),
      )
      this._ui.setAttribute('aria-hidden', 'true')

      if (!this._uiContainer) {
        this._ui = this._makeElement({sznOptionsUi: ''},
          this._ui,
        )
      }
      (this._uiContainer || document.body).appendChild(this._ui)

      // TODO: add events to the root
    }

    _createOptionGroupOptions(optionsGroup) {
      const generatedUI = document.createDocumentFragment()
      let currentOption = optionsGroup.firstElementChild
      while (currentOption) {
        let optionUI
        if (currentOption.tagName === 'OPTGROUP') {
          optionUI = this._makeElement({group: ''},
            this._makeElement({groupLabel: ''},
              document.createTextNode(currentOption.label),
            ),
            this._createOptionGroupOptions(currentOption),
          )
        } else {
          optionUI = this._makeElement({option: ''},
            document.createTextNode(currentOption.innerText),
          )
          if (currentOption.selected) {
            optionUI.dataset.selected = ''
          }
        }
        optionUI._model = currentOption
        if (currentOption.disabled) {
          optionUI.dataset.disabled = ''
        }
        generatedUI.appendChild(optionUI)
        currentOption = currentOption.nextElementSibling
      }
      return generatedUI
    }

    _makeElement(dataSet, ...children) {
      const element = document.createElement('szn-')
      for (const property of Object.keys(dataSet)) {
        element.dataset[property] = dataSet[property]
      }
      for (const child of children) {
        element.appendChild(child)
      }
      return element
    }
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
