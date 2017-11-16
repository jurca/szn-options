'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  // TODO: when scrolling, scroll to the currently selected option on change
  SznElements['szn-options'] = class SznOptions {
    constructor(rootElement) {
      rootElement.setOptions = (options) => this.setOptions(options)
      rootElement.updateUi = () => updateUi(this)

      this._root = rootElement
      this._options = null
      this._dragSelectionStartOption = null
      this._mounted = false

      this._onItemHovered = event => {
        if (this._options.type !== 'select-one') {
          return
        }

        const itemUi = event.target
        if (
          !itemUi.hasAttribute('data-szn-options-option') ||
          itemUi._option.disabled ||
          itemUi._option.parentNode.disabled
        ) {
          return
        }

        this._root.setAttribute('data-szn-options-highlighting', '')
        const previouslyHighlighted = this._root.querySelector('[data-szn-options-highlighted]')
        if (previouslyHighlighted) {
          previouslyHighlighted.removeAttribute('data-szn-options-highlighted')
        }
        itemUi.setAttribute('data-szn-options-highlighted', '')
      }

      this._onItemClicked = event => {
        if (this._dragSelectionStartOption) {
          return // multi-select
        }

        const itemUi = event.target
        if (
          !itemUi.hasAttribute('data-szn-options-option') ||
          itemUi._option.disabled ||
          itemUi._option.parentNode.disabled
        ) {
          return
        }

        this._root.removeAttribute('data-szn-options-highlighting')
        this._options.selectedIndex = itemUi._option.index
        this._options.dispatchEvent(new CustomEvent('change', {bubbles: true, cancelable: true}))
      }
    }

    onMount() {
      this._mounted = true
      addEventListeners(this)
    }

    onUnmount() {
      removeEventListeners(this)
      this._root.removeAttribute('data-szn-options-highlighting')
      this._mounted = false
    }

    setOptions(options) {
      if (this._options) {
        removeEventListeners(this)
      }

      this._options = options
      addEventListeners(this)
      updateUi(this)
    }
  }

  function addEventListeners(instance) {
    if (!instance._mounted || !instance._options) {
      return
    }

    instance._options.addEventListener('change', instance._root.updateUi)
    instance._root.addEventListener('mouseover', instance._onItemHovered)
    instance._root.addEventListener('mouseup', instance._onItemClicked)
  }

  function removeEventListeners(instance) {
    instance._options.removeEventListener('change', instance._root.updateUi)
    instance._root.removeEventListener('mouseover', instance._onItemHovered)
    instance._root.removeEventListener('mouseup', instance._onItemClicked)
  }

  function updateUi(instance) {
    if (!instance._options) {
      return
    }

    updateGroupUi(instance._root, instance._options)
  }

  function updateGroupUi(uiGroup, optionsGroup) {
    removeRemovedItems(uiGroup, optionsGroup)
    updateExistingItems(uiGroup)
    addMissingItems(uiGroup, optionsGroup)
  }

  function removeRemovedItems(groupUi, options) {}

  function updateExistingItems(groupUi) {
    let itemUi = groupUi.firstElementChild
    while (itemUi) {
      updateItem(itemUi)
      itemUi = itemUi.nextElementSibling
    }
  }

  /**
   * @param {HTMLElement} itemUi
   */
  function updateItem(itemUi) {
    const option = itemUi._option
    if (option.disabled) {
      itemUi.setAttribute('disabled', '')
    } else {
      itemUi.removeAttribute('disabled')
    }

    if (option.tagName === "OPTGROUP") {
      updateGroupUi(itemUi, option)
      itemUi.setAttribute('data-szn-options-optgroup-label', option.label)
      return
    }

    itemUi.innerText = option.text
    if (option.title) {
      itemUi.setAttribute('title', option.title)
    } else {
      itemUi.removeAttribute('title')
    }

    if (option.selected) {
      itemUi.setAttribute('data-szn-options-selected', '')
    } else {
      itemUi.removeAttribute('data-szn-options-selected')
    }
  }

  function addMissingItems(groupUi, options) {
    let nextItemUi = groupUi.firstElementChild
    let nextOption = options.firstElementChild
    while (nextOption) {
      if (!nextItemUi || nextItemUi._option !== nextOption) {
        const newItemUi = document.createElement('szn-')
        newItemUi._option = nextOption
        newItemUi.setAttribute('data-szn-options-' + (nextOption.tagName === "OPTGROUP" ? 'optgroup' : 'option'), '')
        updateItem(newItemUi)
        groupUi.insertBefore(newItemUi, nextItemUi)
      } else {
        nextItemUi = nextItemUi && nextItemUi.nextElementSibling
      }

      nextOption = nextOption.nextElementSibling
    }
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
