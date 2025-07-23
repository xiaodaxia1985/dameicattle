<template>
  <i 
    :class="iconClasses" 
    :style="iconStyle"
    @click="$emit('click')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  animated?: 'pulse' | 'bounce' | 'spin' | false
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  animated: false
})

defineEmits<{
  click: []
}>()

const iconClasses = computed(() => {
  const classes = ['modern-icon', `icon-${props.name}`]
  
  if (props.size !== 'md') {
    classes.push(`modern-icon-${props.size}`)
  }
  
  if (props.animated) {
    classes.push(`icon-${props.animated}`)
  }
  
  return classes
})

const iconStyle = computed(() => {
  return props.color ? { color: props.color } : {}
})
</script>

<style scoped>
.modern-icon {
  cursor: pointer;
  transition: all 0.2s ease;
}

.modern-icon:hover {
  opacity: 0.8;
  transform: scale(1.05);
}
</style>