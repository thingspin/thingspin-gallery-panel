import $ from 'jquery';
import _ from 'lodash';

import { loadPluginCss, MetricsPanelCtrl } from 'grafana/app/plugins/sdk';
import { transformDataToTable } from './core/transformers';
import { galleryPanelEditor } from './core/editor';
import { columnOptionsTab } from './core/column_options';
import { TableRenderer } from './core/renderer';
import './services/MQTT';
import { MqttSrv } from './services/MQTT';

class GalleryPanelCtrl extends MetricsPanelCtrl {
  static template: string = require('./module.html');

  scope: any;
  pageIndex: number;
  dataRaw: any;
  table: any;

  current: any;
  rowIndex: any;
  inProcessing: boolean;
  playerTimer: any;

  pluginBase: any;
  image: any;
  splash: any;

  renderer: any;

  panelDefaults = {
    targets: [{}],
    transform: 'timeseries_to_columns',
    pageSize: null,
    showHeader: true,
    styles: [
      {
        type: 'date',
        pattern: 'Time',
        alias: 'Time',
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
      },
      {
        unit: 'short',
        type: 'number',
        alias: '',
        decimals: 2,
        colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
        colorMode: null,
        pattern: '/.*/',
        thresholds: [],
      },
    ],
    columns: [],
    scroll: true,
    fontSize: '80%',
    sort: { col: 0, desc: true },

    //host: '', //'http://219.251.4.236/',
    host: 'http://219.251.4.236/',
    api: 'public/assets/gallary/pics/',
    splash: 'splash.svg',
    image: 'photo.png',
    imageCol: 'IMAGE',

    repeat: false,
    delay: 0.3,
  };

  /** @ngInject */
  constructor($scope, $injector, //private $element: JQuery,
    private annotationsSrv, private $sanitize, private variableSrv,
    private MqttSrv: MqttSrv) {
    super($scope, $injector);

    this.pageIndex = 0;
    this.rowIndex = -1;
    this.inProcessing = true;
    const urlPath = "/";
    const baseUrl = `ws://219.251.4.236:1884`;
    this.MqttSrv.connect(`${baseUrl}${urlPath}`);


    if (this.panel.styles === void 0) {
      this.panel.styles = this.panel.columns;
      this.panel.columns = this.panel.fields;
      delete this.panel.columns;
      delete this.panel.fields;
    }

    _.defaults(this.panel, this.panelDefaults);

    this.pluginBase = `plugins/${this.pluginId}`;
    this.image = `public/${this.pluginBase}/img/${this.panel.image}`;
    this.splash = `public/${this.pluginBase}/img/${this.panel.splash}`;
    loadPluginCss({
      dark: `${this.pluginBase}/css/dark.css`,
      light: `${this.pluginBase}/css/light.css`
    });

    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('init-panel-actions', this.onInitPanelActions.bind(this));

    this.events.on('image-patch', this.onImagePatch.bind(this));
    this.events.on('ai-processing-state', this.onProcessingEvent.bind(this));
    this.events.on('image-player-action', this.onPlayerEvent.bind(this));
  }
  $onInit() {
  }

  onInitEditMode(): void {
    this.addEditorTab('Options', galleryPanelEditor, 3);
    this.addEditorTab('Column Styles', columnOptionsTab, 4);
  }

  onInitPanelActions(actions): void {
    actions.push({ text: 'Export CSV', click: 'ctrl.exportCsv()' });
  }

  onImagePatch(filename): void {
    this.image = this.panel.host + this.panel.api + filename;
    this.scope.$applyAsync();
  }

  onProcessingEvent(start: boolean) {
    this.inProcessing = start;
    this.scope.$applyAsync();
  }

  onPlayerEvent(data: any): void {
    let { start } = data;

    let row: any = this.table.rows[start];
    this.current = row;

    let image: string = String('');

    this.table.columns.forEach( (item: any, index: number) => {
      if (item.title === this.panel.imageCol) {
        image = row[index];
      }
    });

    if (image === '') {
      return;
    }

    this.events.emit('image-patch', image);

    this.scope.$applyAsync();
  }

  play(): void {
    let count: number = this.table.rows.length;

    if (count === 0) {
      return;
    }

    this.rowIndex = (this.rowIndex === -1) ? 0 : count - 1;

    this.playerTimer = setInterval( () => {
      this.events.emit('image-player-action', {
        action: 'play',
        start: this.rowIndex,
        end: 0,
        repeat: this.panel.repeat
      });

      if (this.rowIndex === 0) {
        this.stop();
      } else {
        this.back();
      }

    }, this.panel.delay * 1000);
  }

  rewind(): void {
    let count: number = this.table.rows.length;

    if (count === 0) {
      return;
    }

    this.rowIndex = (this.rowIndex === -1) ? 0 : this.rowIndex;

    this.playerTimer = setInterval( () => {
      this.events.emit('image-player-action', {
        action: 'play',
        start: this.rowIndex,
        end: this.table.rows.length-1,
        repeat: this.panel.repeat,
      });

      if (this.rowIndex === this.table.rows.length-1) {
        this.stop();
      } else {
        this.next();
      }

    }, this.panel.delay * 1000);
  }

  playBack(): void {
    this.next();
    this.events.emit('image-player-action', {
      action: 'play',
      start: this.rowIndex,
      end: this.table.rows.length-1,
      repeat: this.panel.repeat
    });
    this.stop();
  }

  playNext(): void {
    this.back();
    this.events.emit('image-player-action', {
      action: 'play',
      start: this.rowIndex,
      end: this.table.rows.length-1,
      repeat: this.panel.repeat
    });
    this.stop();
  }

  back(): void {
    this.rowIndex = (this.rowIndex <= 0) ? 0 : this.rowIndex - 1;
  }

  next(): void {
    this.rowIndex = (this.rowIndex >= this.table.rows.length - 1) ? this.rowIndex : this.rowIndex + 1;
  }

  stop(): void {
    clearInterval(this.playerTimer);
  }

  moveTo(at: string): void {
    this.rowIndex = (at === 'first') ? 0 : (at === 'last') ? this.table.rows.length -1 : this.rowIndex;

    this.events.emit('image-player-action', {
      action: 'play',
      start: this.rowIndex,
      end: this.table.rows.length-1,
      repeat: this.panel.repeat
    });
  }

  issueQueries(datasource): any {
    this.pageIndex = 0;

    if (this.panel.transform === 'annotations') {
      this.setTimeQueryStart();
      return this.annotationsSrv
        .getAnnotations({
          dashboard: this.dashboard,
          panel: this.panel,
          range: this.range,
        })
        .then(annotations => {
          return { data: annotations };
        });
    }

    return super.issueQueries(datasource);
  }

  onDataError(err): void {
    this.dataRaw = [];
    this.render();
  }

  onDataReceived(dataList): void {
    this.dataRaw = dataList;
    this.pageIndex = 0;

    // automatically correct transform mode based on data
    if (this.dataRaw && this.dataRaw.length) {
      if (this.dataRaw[0].type === 'table') {
        this.panel.transform = 'table';
      } else {
        if (this.dataRaw[0].type === 'docs') {
          this.panel.transform = 'json';
        } else {
          if (this.panel.transform === 'table' || this.panel.transform === 'json') {
            this.panel.transform = 'timeseries_to_rows';
          }
        }
      }
    }


    this.render();

    this.moveTo('first');
    this.events.emit('image-player-action', {
      action: 'play',
      start: 0,
      end: 0,
      repeat: this.panel.repeat
    });
  }

  render() {
    // $('#aniimatedThumbnials').lightGallery({
    //   thumbnail: true
    // });

    this.table = transformDataToTable(this.dataRaw, this.panel);
    this.table.sort(this.panel.sort);

    this.renderer = new TableRenderer(
      this.panel,
      this.table,
      this.dashboard.isTimezoneUtc(),
      this.$sanitize,
      this.templateSrv
    );

    return super.render(this.table);
  }

  toggleColumnSort(col, colIndex) {
    // remove sort flag from current column
    if (this.table.columns[this.panel.sort.col]) {
      this.table.columns[this.panel.sort.col].sort = false;
    }

    if (this.panel.sort.col === colIndex) {
      if (this.panel.sort.desc) {
        this.panel.sort.desc = false;
      } else {
        this.panel.sort.col = null;
      }
    } else {
      this.panel.sort.col = colIndex;
      this.panel.sort.desc = true;
    }
    this.render();
  }

  moveQuery(target, direction) {
    super.moveQuery(target, direction);
    super.refresh();
  }

  exportCsv() {
    var scope = this.$scope.$new(true);
    scope.tableData = this.renderer.render_values();
    scope.panel = 'table';
    this.publishAppEvent('show-modal', {
      templateHtml: '<export-data-modal panel="panel" data="tableData"></export-data-modal>',
      scope,
      modalClass: 'modal--narrow',
    });
  }

  link(scope, elem, attrs, ctrl: GalleryPanelCtrl) {
    var data;
    var panel = ctrl.panel;
    var pageCount = 0;

    function getTableHeight() {
      var panelHeight = ctrl.height;

      if (pageCount > 1) {
        panelHeight -= 26;
      }

      return panelHeight - 31 + 'px';
    }

    function appendTableRows(tbodyElem) {
      ctrl.renderer.setTable(data);
      tbodyElem.empty();
      tbodyElem.html(ctrl.renderer.render(ctrl.pageIndex));
    }

    function switchPage(e) {
      var el = $(e.currentTarget);
      ctrl.pageIndex = parseInt(el.text(), 10) - 1;
      renderPanel();
    }

    // sooskim : image row click
    function showImageClicked(e) {
      var el = $(e.currentTarget);
      let row = parseInt(el.attr('row'));
      let data = ctrl.table.rows[row];

      ctrl.current = data;

      let image = '';

      ctrl.table.columns.forEach((item, index) => {
        if (item.title === ctrl.panel.imageCol) {
          image = data[index];
        }
      });

      if (image === '') {
        return;
      }

      ctrl.events.emit('image-patch', image);
    }

    function appendPaginationControls(footerElem) {
      footerElem.empty();

      var pageSize = panel.pageSize || 100;
      pageCount = Math.ceil(data.rows.length / pageSize);
      if (pageCount === 1) {
        return;
      }

      var startPage = Math.max(ctrl.pageIndex - 3, 0);
      var endPage = Math.min(pageCount, startPage + 9);

      var paginationList = $('<ul></ul>');

      for (var i = startPage; i < endPage; i++) {
        var activeClass = i === ctrl.pageIndex ? 'active' : '';
        var pageLinkElem = $(
          '<li><a class="table-panel-page-link pointer ' + activeClass + '">' + (i + 1) + '</a></li>'
        );
        paginationList.append(pageLinkElem);
      }

      footerElem.append(paginationList);
    }

    function renderPanel() {
      var panelElem = elem.parents('.panel-content');
      var rootElem = elem.find('.table-panel-scroll');
      var tbodyElem = elem.find('tbody');
      var footerElem = elem.find('.table-panel-footer');

      elem.css({ 'font-size': panel.fontSize });
      panelElem.addClass('table-panel-content');

      appendTableRows(tbodyElem);
      appendPaginationControls(footerElem);

      rootElem.css({ 'max-height': panel.scroll ? getTableHeight() : '' });


    }

    // hook up link tooltips
    elem.tooltip({
      selector: '[data-link-tooltip]',
    });

    function addFilterClicked(e) {
      let filterData = $(e.currentTarget).data();
      var options = {
        datasource: panel.datasource,
        key: data.columns[filterData.column].text,
        value: data.rows[filterData.row][filterData.column],
        operator: filterData.operator,
      };

      ctrl.variableSrv.setAdhocFilter(options);
    }

    elem.on('click', '.table-panel-page-link', switchPage);
    elem.on('click', '.table-panel-filter-link', addFilterClicked);
    elem.on('click', '.table-row-image', showImageClicked); // sooskim

    var unbindDestroy = scope.$on('$destroy', function() {
      elem.off('click', '.table-panel-page-link');
      elem.off('click', '.table-panel-filter-link');
      elem.off('click', '.table-row-image');
      unbindDestroy();
    });

    ctrl.events.on('render', function(renderData) {
      data = renderData || data;
      if (data) {
        renderPanel();
      }
      ctrl.renderingCompleted();
    });
  }
}

export {
  GalleryPanelCtrl,
  GalleryPanelCtrl as PanelCtrl
};
