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
      this._isWatchingOptions = false

      this.onClick = event => {
        const target = event.target
        if (
          !target.hasAttribute('data-option') ||
          target.hasAttribute('data-disabled') ||
          target._group.disabled ||
          target._model.selected
        ) {
          return
        }

        target._model.selected = true
        this._optionsContainer.dispatchEvent(new CustomEvent('change', {bubbles: true, cancelable: true}))
      }

      this.onSelectionChange = () => {
        const selectedOptionUi = this._ui.querySelector('[data-selected]')
        dropDataAttribute(selectedOptionUi, 'selected')
        for (const optionUi of Array.prototype.slice.call(this._ui.querySelectorAll('[data-option]'))) {
          if (optionUi._model.selected) {
            setDataAttribute(optionUi, 'selected')
          }
        }
      }
    }

    onMount() {
      if (this._ui) {
        this._initUiAdjustments()
      }

      if (!this._isWatchingOptions && this._optionsContainer) {
        this._startWatchingOptions()
      }
    }

    setTetherElement(tether) {
      if (this._uiContainer) {
        throw new Error(
          'A UI container has already been provided in the DOM for this szn-options element, a tether cannot be set',
        )
      }
      this._tether = tether
      this._updatePosition()
      this._updateSize()
    }

    setOptionsContainerElement(container) {
      if (this._optionsContainer && this._isWatchingOptions) {
        this._stopWatchingOptions()
      }
      this._optionsContainer = container
      this._createUI()

      if (this._root.parentNode) { // we are already mounted to the DOM
        this._initUiAdjustments()
        if (!this._isWatchingOptions) {
          this._startWatchingOptions()
        }
      }
    }

    onUnmount() {
      if (this._isWatchingOptions) {
        this._stopWatchingOptions()
      }

      if (this._ui) {
        this._ui.parentNode.removeChild(this._ui)
        off(this._ui, 'click', this.onClick)
      }
    }

    _startWatchingOptions() {
      for (const eventType of ['change', 'keypress']) {
        on(this._optionsContainer, eventType, this.onSelectionChange)
      }
      // TODO: observe DOM changes
      this._isWatchingOptions = true
    }

    _stopWatchingOptions() {
      for (const eventType of ['change', 'keypress']) {
        off(this._optionsContainer, eventType, this.onSelectionChange)
      }
      this._isWatchingOptions = false
    }

    _initUiAdjustments() {
      this._updatePosition()
      this._updateSize()
      setInterval(() => {
        this._updatePosition()
        this._updateSize()
      }, 10) // TODO: use events instead
    }

    _updatePosition() {
      if (!this._uiContainer) {
        if (this._tether) {
          this._updateTetheredOptionsPosition()
        }
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

    _updateTetheredOptionsPosition() {
      const uiRoot = this._ui._root
      const tetherBounds = this._tether.getBoundingClientRect()
      const tetherCenter = {
        x: tetherBounds.left + tetherBounds.width / 2,
        y: tetherBounds.top + tetherBounds.height / 2,
      }

      if (tetherCenter.y > window.innerHeight / 2) {
        this._verticalPosition = VERTICAL_POSITION.TOP
        uiRoot.style.top = 0
      } else {
        this._verticalPosition = VERTICAL_POSITION.BOTTOM
        uiRoot.style.top = `${tetherBounds.bottom + document.scrollingElement.scrollTop}px`
      }

      const uiBounds = this._ui._root.getBoundingClientRect()
      if (tetherBounds.left + uiBounds.width < window.innerWidth) {
        this._horizontalPosition = HORIZONTAL_POSITION.LEFT
        uiRoot.style.left = `${tetherBounds.left + document.scrollingElement.scrollLeft}px`
      } else {
        this._horizontalPosition = HORIZONTAL_POSITION.RIGHT
        uiRoot.style.left = `${tetherBounds.right - uiBounds.width + document.scrollingElement.scrollLeft}px`
      }
    }

    _updateSize() {
      if (this._uiContainer) {
        const uiRootBounds = this._ui._root.getBoundingClientRect()
        if (this._verticalPosition === VERTICAL_POSITION.TOP) {
          this._ui._root.style.maxHeight = `${uiRootBounds.bottom}px`
        } else {
          const viewportHeight = window.innerHeight
          this._ui._root.style.maxHeight = `${viewportHeight - uiRootBounds.top}px`
        }
      } else if (this._tether) {
        const tetherBounds = this._tether.getBoundingClientRect()
        if (this._verticalPosition === VERTICAL_POSITION.TOP) {
          this._ui._root.style.maxHeight = `${tetherBounds.top}px`
        } else {
          this._ui._root.style.maxHeight = `${window.innerHeight - tetherBounds.bottom}px`
        }
      }
    }

    _createUI() {
      // TODO: make the UI invisible if we are detached and not mounted yet
      if (this._ui) {
        this._ui.parentNode.removeChild(this._ui)
      }

      this._ui = makeElement(['root'],
        this._createOptionGroupOptions(this._optionsContainer),
      )
      this._ui._root = this._ui
      this._ui.setAttribute('role', 'listbox')

      if (!this._uiContainer) {
        const uiRoot = this._ui
        this._ui = makeElement(['szn-options-ui', 'tethered'],
          this._ui,
        )
        this._ui._root = uiRoot
      }
      (this._uiContainer || document.body).appendChild(this._ui)

      on(this._ui, 'click', this.onClick)
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
          optionUI.setAttribute('role', 'option')
          optionUI._group = optionsGroup
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

  function on(eventTarget, eventType, listener) {
    eventTarget.addEventListener(eventType, listener)
  }

  function off(eventTarget, eventType, listener) {
    eventTarget.removeEventListener(eventType, listener)
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
