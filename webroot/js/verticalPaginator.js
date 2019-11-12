(function( $ ) {
    $( document ).ready(function() {

		/**
		 * Вертикальная AJAX-листалка.
		 * 
		 * Схема шаблона для работы прелоадера выглядит следующим образом:
		 * 
		 * 												   this.element (<div>...</div>)
		 * 												  /
		 * 		Скрытое поле с адресом <input...>		 /
		 * 		+---------------------------------------+
		 * 		|	"труббер" class="trubber"			|
		 * 		|	"кнопка" class="button-preloader"	|
		 * 		+---------------------------------------+
		 * 		Скрытое поле с адресом <input...>
		 * 
		 * Шаблон включает в себя оболочку (this.element) внутри которой располагается
		 * труббер и кнопка. Оболочка обычно представляет собой открывающийся и 
		 * закрывающийся тег "<div>". Труббер, располагающийся внутри оболочки, должен
		 * иметь класс "trubber", а кнопка - класс "button-preloader". Перед или после оболочки
		 * (this.element) располагается скрытое поле, содержащее адрес AJAX-запроса, а
		 * также GET параметр "page", содержащий в свою очередь, номер запрашиваемой
		 * страницы. В зависимости от того, куда необходимо выводить полученный код от
		 * AJAX-запроса, скрытое поле необходимо располагать перед или после оболочки
		 * (this.element). После получения ответа от сервера скрытое поле будет заменено
		 * на html код, полученный от сервера. Поэтому необходимо следить за тем, куда
		 * будет выводиться скрытое поле: если листинг объектов будет выводится выше
		 * оболочки (this.element), необходимо, чтобы скрытое поле шло внизу листинга 
         * объектов. Такой вывод гарантирует, что скрытое поле будет расположенно перед
         * оболочкой. Для правильной работы пагинатора необходимо следить, чтобы скрытое
         * поле располагалось сразу перед или после оболочки (this.element). Описанный
         * выше шаблон (см. рисунок выше) необходимо размещать на странице, где
         * необходима пагинация. Код, который возвращается от AJAX-запроса, должен
         * содержать только скрытое поле. Поэтому в шаблоне, который использует AJAX-
         * запрос, необходимо генерировать только скрытое поле. Ниже показано, каким 
         * образом это реализовать.
         * Также необходимо отметить, что если будет использоваться режим "viewLoader=preloader",
         * в оболочке (this.element) кнопку можно не указывать.
		 * 
		 * Для использования пагинатора необходимо:
		 * 		1. Вставить в шаблон страницы (с расширением "ctp") следующий код:
		 * 			<?php
		 *				$this->Paginator->setTemplates([
		 *					'nextActive' => '
		 *						<input class="hide" value="{{url}}">' .
		 *						'<div id="list-pag">' .
		 *							$this->element('preloader', ['loader_id' => 'sub-loader', 'w' => 56, 'h' => 56]) .
		 *						'</div>',
		 *					'nextDisabled' => '',
		 *				]);
		 *			?>
		 * 			<?= $this->Paginator->next() ?>
		 * 		2. В шаблон, который используется при AJAX-запросе вставить:
		 * 			<?php
		 *				$this->Paginator->setTemplates([
		 *					'nextActive' => '<input class="hide" value="{{url}}">',
		 *					'nextDisabled' => '',
		 *				]);
		 *			?>
		 *			<?= $this->Paginator->next() ?>
		 * 		3. Далее необходимо инициализировать JavaScript код:
		 * 			$( '#list-pag' ).verticalPaginator({ viewLoader: 'preloader' });
		 * 
		 * @param object this.element
		 * 		Объект оболочки, где расположена кнопка и прелоадер.
		 * @param string viewLoader
		 * 		Когда запрашивать новую страницу:
		 * 			"button-preloader" - при нажатие кнопки показывать следующую страницу;
		 * 			"preloader" - при достижение конца страницы показывать следующую страницу.
		 * @param int retreat
		 * 		Добавочный отступ к расстоянию до элемента, при котором включается AJAX-код.
		 * 		Действует только для "viewLoader=preloader".
		 * @param string paste
		 * 		Куда вставлять html код, вернувшийся от AJAX-кода:
		 * 			"before" - перед объектом this.element;
		 * 			"after" - после объекта this.element.
		 */
		$.widget( "paginator.verticalPaginator", $.lib.ajax, {

			/**
			 * @param bool lifecicle
			 * 		Жизненный цикл пагинатора. "true" - начало цикла, "false" - цикл закончен.
			 * 		По умолчанию содержит значение "null", чтобы можно было определить начало жизненного цикла.
			 */
			_lifecicle: null,

			/**
			 * @param object _objectHiddenInput
			 * 		Объект скрытого поля.
			 */
			_objectHiddenInput: null,
			
			/**
			 * @param object _button
			 * 		Объект кнопки.
			 */
			_button: null,
			
			/**
			 * @param object _trubber
			 * 		Объект труббера.
			 */
			_trubber: null,

			/**
			 * Список значений и настроек по умолчанию.
			 * 
			 * @param string viewLoader
			 * 		Когда запрашивать новую страницу:
			 * 			"button-preloader" - при нажатие кнопки показывать следующую страницу;
			 * 			"preloader" - при достижение конца страницы показывать следующую страницу.
			 * @param int retreat
			 * 		Добавочный отступ к расстоянию до элемента, при котором включается AJAX-код.
			 * 		Действует только для "viewLoader=preloader".
			 * @param string paste
			 * 		Куда вставлять html код, вернувшийся от AJAX-кода:
			 * 			"before" - перед объектом this.element;
			 * 			"after" - после объекта this.element.
			 */
    		options: {
				viewLoader: null,
				retreat: 160,
				paste: 'before',
			},

    		/**
			 * Конструктор плагина.
			 */
    		_create: function() {
				if ( this.options.viewLoader == 'button-preloader' ) {
					this._button = this.element.find( '.button-preloader' );
					this._trubber = this.element.find( '.trubber' );
					this._buttonPreloader();
				}
    			if ( this.options.viewLoader == 'preloader' ) {
					this._trubber = this.element.find( '.trubber' );
					this._preloader();
				}
			},
			
			/**
			 * Для "viewLoader" равной "button-preloader".
			 */
    		_buttonPreloader: function() {
				// Событие - нажатие кнопки.
				this._button.on( 'click', { mythis: this }, function( event ) {
					// Показываем труббер, скрываем кнопку.
                    $( this ).addClass( 'hide' );
                    event.data.mythis._trubber.removeClass( 'hide' );
                    event.data.mythis.nextPage();
				});
			},
			
			/**
			 * Для "viewLoader" равной "preloader".
			 */
    		_preloader: function() {
    			var This = this;
    			// Событие - скроллинг страницы.
    			$( window ).scroll( function( event ) {
					if ( This._lifecicle === null || This._lifecicle == true ) {
						// Полная высота страницы.
						let fullHeightPage = Math.max(
							document.body.scrollHeight, document.documentElement.scrollHeight,
							document.body.offsetHeight, document.documentElement.offsetHeight,
							document.body.clientHeight, document.documentElement.clientHeight
						);
						// Видимая область окна.
						let viewH = document.documentElement.clientHeight;
						// Расстояние до элемента.
						let elemH = This.element.offset().top;
						// Прокрутка окна.
						let html = document.documentElement;
						let body = document.body;
						let scrollTop = html.scrollTop || body && body.scrollTop || 0;
						scrollTop -= html.clientTop; // в IE7- <html> смещён относительно (0,0)
						// Определяем, когда запускать AJAX код.
						let retreat = This.options.retreat;
						if ( ( scrollTop + viewH + retreat ) > elemH ) {
							This._trubber.removeClass( 'hide' );
							This.nextPage();
						}
					}
    			});
    		},

		    /**
			 * AJAX-запрос: следующая страница.
			 */
			nextPage: function() {
				this._lifecicle = true;
                this._method = 'GET';
                this._datatype = 'html';
                this._updateObjectHiddenInput();
                if ( this._objectHiddenInput ) {
					this._urlAjax = this._objectHiddenInput.val();
					let data = { empty: 0 };
					if ( this.options.viewLoader == 'button-preloader' ) this._Ajax( data, 'paginator' );
					if ( this.options.viewLoader == 'preloader' ) this._lockAjax( data, 'paginator' );
				}
			},

			/**
             * Ответ от сервера успешно получен.
             * 
             * @param string html
             * 		html код, вернувшийя от сервера.
             */
            _paginatorSuccess: function( html ) {
				// Скрываем труббер.
                this._trubber.addClass( 'hide' );
                // Вставляем html код, вернувшийся от сервера.
                this._objectHiddenInput.replaceWith( html );
                this._updateObjectHiddenInput();
                if ( this._objectHiddenInput ) {
                    // Если скрытое поле существует.
                    // Показываем кнопку и скрываем труббер.
                    if ( this.options.viewLoader == 'button-preloader' ) {
						this._button.removeClass( 'hide' );
						this._trubber.addClass( 'hide' );
					}
                    // или скрываем труббер.
					if ( this.options.viewLoader == 'preloader' ) {
						this._trubber.removeClass( 'hide' );
					}
                }
                else {
                    // Удаляем кнопку с прелоадером.
                    this.element.remove();
                    this._lifecicle = false;
                }
			},

			/**
			 * Обновляет объект скрытого поля.
			 * 
			 * Необходимо после вставки очередного htmlAJAX кода обновлять объект скрытого поля (находить новый
			 * объект скрытого поля). Это связано с тем, что при вставке htmlAJAX кода объект скрытого поля заменяется
			 * на htmlAJAX код.
			 */
			_updateObjectHiddenInput: function() {
				if ( this.options.paste == 'before' ) {
					if ( this.element.prev().hasClass( 'hide' ) ) {
						this._objectHiddenInput = this.element.prev();
					}
					else this._objectHiddenInput = null;
				}
				if ( this.options.paste == 'after' ) {
					if ( this.element.next().hasClass( 'hide' ) ) {
						this._objectHiddenInput = this.element.next();
					}
					else this._objectHiddenInput = null;
				}
			},

		});

	});
})( jQuery );
