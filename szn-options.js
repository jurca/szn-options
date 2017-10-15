'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  const VERTICAL_POSITION = {
    TOP: 'VERTICAL_POSITION.TOP',
    BOTTOM: 'VERTICAL_POSITION.BOTTOM',
  }

  const HORIZONTAL_POSITION = {
    LEFT: 'HORIZONTAL_POSITION.LEFT',
    RIGHT: 'HORIZONTAL_POSITION.RIGHT',
  }

  SznElements['szn-options'] = class SznOptions {
    constructor(rootElement, uiContainer) {
      this._root = rootElement
      this._uiContainer = uiContainer
      this._ui = null
      this._horizontalPosition = HORIZONTAL_POSITION.LEFT
      this._verticalPosition = VERTICAL_POSITION.BOTTOM
      this._tether = null
      this._optionsContainer = null
    }

    onMount() {
      if (this._ui) {
        this._initUiAdjustments()
      }
    }

    setTetherElement(tether) {
      if (this._uiContainer) {
        throw new Error(
          'A UI container has already been provided in the DOM for this szn-options element, a tether cannot be set',
        )
      }
      this._tether = tether
    }

    setOptionsContainerElement(container) {
      // TODO: quit observing changes
      this._optionsContainer = container
      // TODO: observe changes
      this._createUI()

      if (this._root.parentNode) { // we are already mounted to the DOM
        this._initUiAdjustments()
      }
    }

    onUnmount() {
      // TODO: quit observing changes, drop UI
    }

    _initUiAdjustments() {
      this._updatePosition()
      this._updateSize()
      setInterval(() => {
        this._updatePosition()
        this._updateSize()
      }, 10)
    }

    _updatePosition() {
      if (!this._uiContainer) {
        return
      }

      const viewportHeight = window.innerHeight
      const uiRootBounds = this._ui._root.getBoundingClientRect()
      if (this._verticalPosition === VERTICAL_POSITION.BOTTOM) {
        if (uiRootBounds.top > viewportHeight / 2) {
          this._verticalPosition = VERTICAL_POSITION.TOP
          setDataAttribute(this._ui._root, 'position-top')
        }
      } else {
        const bottomOffset = parseFloat(getComputedStyle(this._ui._root).bottom)
        if (uiRootBounds.bottom < viewportHeight / 2 - bottomOffset) {
          this._verticalPosition = VERTICAL_POSITION.BOTTOM
          dropDataAttribute(this._ui._root, 'position-top')
        }
      }

      const viewportWidth = window.innerWidth
      if (uiRootBounds.width > viewportWidth) {
        return
      }
      if (this._horizontalPosition === HORIZONTAL_POSITION.LEFT) {
        if (uiRootBounds.right > viewportWidth) {
          this._horizontalPosition = HORIZONTAL_POSITION.RIGHT
          setDataAttribute(this._ui._root, 'position-right')
        }
      } else {
        if (uiRootBounds.left < 0) {
          this._horizontalPosition = HORIZONTAL_POSITION.LEFT
          dropDataAttribute(this._ui._root, 'position-right')
        }
      }
    }

    _updateSize() {
      const uiRootBounds = this._ui._root.getBoundingClientRect()
      if (this._verticalPosition === VERTICAL_POSITION.TOP) {
        this._ui._root.style.maxHeight = `${uiRootBounds.bottom}px`
      } else {
        const viewportHeight = window.innerHeight
        this._ui._root.style.maxHeight = `${viewportHeight - uiRootBounds.top}px`
      }
    }

    _createUI() {
      if (this._ui) {
        this._ui.parentNode.removeChild(this._ui)
      }

      this._ui = makeElement(['root'],
        this._createOptionGroupOptions(this._optionsContainer),
      )
      this._ui._root = this._ui
      this._ui.setAttribute('aria-hidden', 'true')

      if (!this._uiContainer) {
        const uiRoot = this._ui
        this._ui = makeElement(['szn-options-ui'],
          this._ui,
        )
        this._ui._root = uiRoot
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
          optionUI = makeElement(['group'],
            makeElement(['group-label'],
              document.createTextNode(currentOption.label),
            ),
            this._createOptionGroupOptions(currentOption),
          )
        } else {
          optionUI = makeElement(['option'],
            document.createTextNode(currentOption.innerText),
          )
          if (currentOption.selected) {
            setDataAttribute(optionUI, 'selected')
          }
        }
        optionUI._model = currentOption
        if (currentOption.disabled) {
          setDataAttribute(optionUI, 'disabled')
        }
        generatedUI.appendChild(optionUI)
        currentOption = currentOption.nextElementSibling
      }
      return generatedUI
    }
  }

  function makeElement(dataAttributes, ...children) {
    const element = document.createElement('szn-')
    for (const attribute of dataAttributes) {
      setDataAttribute(element, attribute, '')
    }
    for (const child of children) {
      element.appendChild(child)
    }
    return element
  }

  function setDataAttribute(element, attribute, value = '') {
    element.setAttribute(`data-${attribute}`, value)
  }

  function dropDataAttribute(element, attribute) {
    element.removeAttribute(`data-${attribute}`)
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
