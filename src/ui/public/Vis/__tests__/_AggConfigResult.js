describe('AggConfigResult', function () {
  let _ = require('lodash');
  let AggConfigResult = require('ui/Vis/AggConfigResult');
  let expect = require('expect.js');
  let ngMock = require('ngMock');

  let AggConfig;
  let indexPattern;
  let Vis;

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject(function (Private) {
    Vis = Private(require('ui/Vis'));
    AggConfig = Private(require('ui/Vis/AggConfig'));
    indexPattern = Private(require('fixtures/stubbed_logstash_index_pattern'));
  }));

  describe('initialization', function () {
    it('should set the type to bucket for bucket based results', function () {
      let vis = new Vis(indexPattern, {
        type: 'histogram',
        aggs: [ { type: 'terms', schema: 'segment', params: { field: '_type' } } ]
      });
      let aggConfig = vis.aggs.byTypeName.terms[0];
      let results = new AggConfigResult(aggConfig, null, 10, 'apache');
      expect(results).to.have.property('aggConfig', aggConfig);
      expect(results).to.have.property('$parent', null);
      expect(results).to.have.property('type', 'bucket');
      expect(results).to.have.property('value', 10);
      expect(results).to.have.property('key', 'apache');
    });

    it('should set the type to metric for metric based results', function () {
      let vis = new Vis(indexPattern, {
        type: 'histogram',
        aggs: [ { type: 'avg', schema: 'metric', params: { field: 'bytes' } } ]
      });
      let aggConfig = vis.aggs.byTypeName.avg[0];
      let results = new AggConfigResult(aggConfig, null, 1024);
      expect(results).to.have.property('aggConfig', aggConfig);
      expect(results).to.have.property('$parent', null);
      expect(results).to.have.property('type', 'metric');
      expect(results).to.have.property('value', 1024);
      expect(results).to.have.property('key', undefined);
    });
  });


  describe('hierarchical', function () {
    describe('getPath()', function () {

      it('should return the parent and itself (in an array) for the path', function () {
        let vis = new Vis(indexPattern, {
          type: 'histogram',
          aggs: [
            { type: 'terms', schema: 'segment', params: { field: '_type' } },
            { type: 'terms', schema: 'segment', params: { field: 'extension' } }
          ]
        });
        let parentAggConfig = vis.aggs.byTypeName.terms[0];
        let aggConfig = vis.aggs.byTypeName.terms[1];
        let parentResult = new AggConfigResult(parentAggConfig, null, 20, 'apache');
        let result = new AggConfigResult(aggConfig, parentResult, 15, 'php');
        let path = result.getPath();
        expect(path).to.be.an(Array);
        expect(path).to.have.length(2);
        expect(path[0]).to.be(parentResult);
        expect(path[1]).to.be(result);
      });

      it('should return itself (in an array) for the path', function () {
        let vis = new Vis(indexPattern, {
          type: 'histogram',
          aggs: [
            { type: 'terms', schema: 'segment', params: { field: 'extension' } }
          ]
        });
        let aggConfig = vis.aggs.byTypeName.terms[0];
        let result = new AggConfigResult(aggConfig, null, 15, 'php');
        let path = result.getPath();
        expect(path).to.be.an(Array);
        expect(path).to.have.length(1);
        expect(path[0]).to.be(result);
      });

    });

    describe('createFilter', function () {
      it('should return a filter object that represents the result', function () {
        let vis = new Vis(indexPattern, {
          type: 'histogram',
          aggs: [
            { type: 'terms', schema: 'segment', params: { field: 'extension' } }
          ]
        });
        let aggConfig = vis.aggs.byTypeName.terms[0];
        let result = new AggConfigResult(aggConfig, null, 15, 'php');
        let filter = result.createFilter();
        expect(filter).to.have.property('query');
        expect(filter.query).to.have.property('match');
        expect(filter.query.match).to.have.property('extension');
        expect(filter.query.match.extension).to.have.property('query', 'php');
        expect(filter.query.match.extension).to.have.property('type', 'phrase');
      });
    });
  });
});
