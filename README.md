# Ajaxpaginator плагин для CakePHP

## Инсталяция

Вы можете установить этот плагин в свое приложение CakePHP с помощью [composer](https://getcomposer.org).

Установка плагина:

```
$ sudo composer require your-name-here/ajaxpaginator
$ sudo composer dumpautoload
```

#### Инициализация

1. Вставить в шаблон страницы (с расширением "ctp") следующий код:

```php
<?php
    $this->Paginator->setTemplates([
        'nextActive' => '
        <input class="hide" value="{{url}}">' .
        '<div id="list-pag">' .
            $this->element('preloader', ['loader_id' => 'sub-loader', 'w' => 56, 'h' => 56]) .
        '</div>',
        'nextDisabled' => '',
    ]);
?>
<?= $this->Paginator->next() ?>
```

2. В шаблон, который используется при AJAX-запросе вставить:

```php
<?php
    $this->Paginator->setTemplates([
        'nextActive' => '<input class="hide" value="{{url}}">',
        'nextDisabled' => '',
    ]);
?>
<?= $this->Paginator->next() ?>
```

3. Далее необходимо инициализировать JavaScript код:

```js
$( '#list-pag' ).verticalPaginator({ viewLoader: 'preloader' });
```




