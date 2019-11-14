<?php
/**
 * Вертикальный прелоадер.
 */
?>
<div
	<?php if (isset($loader_id)) echo ' id="' . $loader_id . '"'; ?>
	<?php if (is_array($loader_class)) echo ' class="' . implode(' ', $loader_class) . '"'; ?>
>
	<?= $this->element('loader', [
		'width' => (isset($w)) ? $w : 100,
		'height' => (isset($h)) ? $h : 100,
		'color1' => '#90EE90',
		'color2' => '#008000',
	]) ?>
</div>
