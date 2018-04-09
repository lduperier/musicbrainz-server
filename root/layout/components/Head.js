// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2015 MetaBrainz Foundation
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

const React = require('react');

const manifest = require('../../static/manifest');
const DBDefs = require('../../static/scripts/common/DBDefs');
const {l} = require('../../static/scripts/common/i18n');
const escapeClosingTags = require('../../utility/escapeClosingTags');
const MetaDescription = require('./MetaDescription');

let canonRegexp = new RegExp('^(https?:)?//' + DBDefs.WEB_SERVER);
function canonicalize(url) {
  return DBDefs.CANONICAL_SERVER ? url.replace(canonRegexp, DBDefs.CANONICAL_SERVER) : url;
}

function getTitle(props) {
  let {title, pager} = props;

  if (!props.homepage) {
    let parts = [];

    if (title) {
      parts.push(title);
    }

    if (pager && pager.current_page && pager.current_page > 1) {
      parts.push(l('Page {n}', {n: pager.current_page}));
    }

    parts.push('MusicBrainz');
    title = parts.join(' - ');
  }

  return title;
}

const CanonicalLink = ({href}) => {
  const reqUri = $c.req.uri;
  const canonUri = canonicalize(href || reqUri);
  if (reqUri !== canonUri) {
    return <link rel="canonical" href={canonUri} />;
  }
  return null;
};

const Head = (props) => (
  <head>
    <meta charSet="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <MetaDescription entity={$c.stash.entity} />

    <title>{getTitle(props)}</title>

    <CanonicalLink href={props.canonical_url} />

    {manifest.css('common')}

    {props.no_icons ? null : manifest.css('icons')}

    <link rel="search" type="application/opensearchdescription+xml" title={l('MusicBrainz: Artist')} href="/static/search_plugins/opensearch/musicbrainz_artist.xml" />
    <link rel="search" type="application/opensearchdescription+xml" title={l('MusicBrainz: Label')} href="/static/search_plugins/opensearch/musicbrainz_label.xml" />
    <link rel="search" type="application/opensearchdescription+xml" title={l('MusicBrainz: Release')} href="/static/search_plugins/opensearch/musicbrainz_release.xml" />
    <link rel="search" type="application/opensearchdescription+xml" title={l('MusicBrainz: Track')} href="/static/search_plugins/opensearch/musicbrainz_track.xml" />

    <noscript>
      <style
        dangerouslySetInnerHTML={{__html: '.header > .right > .bottom > .menu > li:focus > ul { left: auto; }'}}
        type="text/css"
      />
    </noscript>

    {manifest.js('rev-manifest')}

    {manifest.js('common/i18n/jedData.json')}

    {$c.stash.current_language !== 'en'
      ? ['mb_server'].concat(props.gettext_domains || []).map(function (domain) {
          const name = 'jed-' + $c.stash.current_language + '-' + domain;
          return manifest.js(name, {key: name});
        })
      : null}

    {manifest.js('common', {
      'data-args': JSON.stringify({
        user: $c.user ? {id: $c.user.id, name: $c.user.name} : null,
      }),
    })}

    {$c.stash.jsonld_data ? (
      <script
        dangerouslySetInnerHTML={{__html: escapeClosingTags(JSON.stringify($c.stash.jsonld_data))}}
        type="application/ld+json"
      />
    ) : null}

    {DBDefs.GOOGLE_ANALYTICS_CODE ? (
      <script type="text/javascript" dangerouslySetInnerHTML={{__html: `
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', '${DBDefs.GOOGLE_ANALYTICS_CODE}']);
        _gaq.push(['_setCustomVar', 1, 'User is logged in', '${$c.user ? "Yes" : "No"}', 2]);
        _gaq.push(['_trackPageview']);

        (function () {
          var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
          ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
        })();
      `}}></script>
    ) : null}
  </head>
);

module.exports = Head;
