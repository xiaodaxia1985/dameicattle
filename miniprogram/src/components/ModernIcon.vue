<template>
  <view 
    :class="iconClasses" 
    :style="iconStyle"
    @tap="$emit('click')"
  />
</template>

<script>
export default {
  name: 'ModernIcon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
    },
    color: {
      type: String,
      default: ''
    },
    animated: {
      type: [String, Boolean],
      default: false,
      validator: (value) => [false, 'pulse', 'bounce', 'spin'].includes(value)
    }
  },
  emits: ['click'],
  computed: {
    iconClasses() {
      const classes = ['modern-icon', `icon-${this.name}`]
      
      if (this.size !== 'md') {
        classes.push(`modern-icon-${this.size}`)
      }
      
      if (this.animated) {
        classes.push(`icon-${this.animated}`)
      }
      
      return classes.join(' ')
    },
    iconStyle() {
      return this.color ? { color: this.color } : {}
    }
  }
}
</script>

<style scoped>
.modern-icon {
  transition: all 0.2s ease;
}

.modern-icon:active {
  opacity: 0.7;
  transform: scale(0.95);
}
</style>