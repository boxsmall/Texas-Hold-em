<template>
  <div class="pot-display">
    <div class="pot-label">彩池</div>
    <div class="pot-amount">{{ pot }}</div>
  </div>
</template>

<script>
export default {
  name: 'PotDisplay',
  props: {
    pot: {
      type: Number,
      default: 0
    },
    phase: String
  }
}
</script>

<style scoped>
.pot-display {
  background: rgba(0, 0, 0, 0.7);
  padding: 12px 30px;
  border-radius: 30px;
  border: 2px solid rgba(233, 69, 96, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.pot-label {
  color: #a0a0c0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.pot-amount {
  color: #ffd700;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}
</style>
