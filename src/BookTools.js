/**
 * BookTools
 * Adds helper tools to the sidebar for working with books
 * @author: Helder (https://github.com/he7d3r)
 * @license: CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0/>
 */
( function ( mw, $, pathoschild ) {
'use strict';

mw.messages.set( {
	'bt-removed-lines': 'Foram removidas $1 linhas duplicadas',
	'bt-no-duplicates': 'Não havia linhas duplicadas',
	'bt-create-list-summary': 'Criação da lista com base no [[$1|índice do livro]]',
	'bt-page-edited': 'A página "$1" foi editada e será exibida a seguir.',
	'bt-page-not-edited': 'Não foi possível editar a página "$1".',
	'bt-check-list': 'Antes de criar a lista de capítulos é preciso conferir' +
		' se a lista gerada pelo script está correta.\n\nDeseja' +
		' que a lista seja criada com o texto atual?',
	'bt-check-list-for-collection': 'Antes de criar a coleção é preciso conferir' +
		' se a lista gerada pelo script está correta.\n\nDeseja' +
		' que a lista seja criada com o texto atual?',
	'bt-sidebar-title': 'Gerenciador de livros',
	'bt-create-template-desc': 'Gerar lista de capítulos',
	'bt-create-collection-desc': 'Gerar coleção',
	'bt-create-print-version-desc': 'Gerar versão para impressão',
	'bt-create-autonav-desc': 'TEST: Criar AutoNav',
	'bt-save-collection-desc': 'Gravar coleção (CUIDADO!)',
	'bt-save-list-desc': 'Gravar lista de capítulos (CUIDADO!)'
} );

var bookName = mw.config.get( 'wgPageName' ).replace(/_/g,' '),
	reLinkCap = new RegExp(
		'.*\\[\\[\\s*(?:/([^\\|\\]]+?)/?|' +
			$.escapeRE( bookName ) +
			'/([^\\|\\]]+?))\\s*(?:(?:#[^\\|\\]]+?)?\\|\\s*[^\\]]+?\\s*)?\\]\\].*',
		'gi'
	);
// Adaptação de um script de Paul Galloway (http://www.synergyx.com)
function dedupeList( items ){
	var i, l,
		count = 0,
		newlist = [],
		hash = {};
	if( !$.isArray( items ) ) {
		return;
	}
	for ( i = 0, l = items.length; i<l; i++ ) {
		if ( hash[items[ i ].toLowerCase()] !== 1 ) {
			newlist = newlist.concat( items[ i ] );
			hash[ items[ i ].toLowerCase() ] = 1;
		} else {
			count++;
		}
	}
	if( count > 0 ) {
		alert( mw.msg( 'bt-removed-lines', count ) );
	} else {
		alert( mw.msg( 'bt-no-duplicates' ) );
	}
	return newlist;
}

function createAutoNav( context ){
	var list = context.$target.val().split('\n'),
		previous = [],
		next = [],
		i;

	previous[0] = list[0];
	next[list.length-1] = list[list.length-1];

	for (i=1;i<list.length-1;i++){
		previous[i] = list[i] + '=[[' + list[i-1] + ']]';
		next[i] = list[i] + '=[[' + list[i+1] + ']]';
	}

	context.$target.val([
		list.join('\n'),
		previous.join('\n'),
		next.join('\n')
	].join( '\n\n' ) );
}

// As funções parseLine e createList foram baseadas nas funções loadCollection e parseCollectionLine da extensão collection
// http://svn.wikimedia.org/viewvc/mediawiki/trunk/extensions/Collection/Collection.body.php?view=markup
function parseLine( line ){
	if( reLinkCap.test( line ) ){
		return $.trim( line.replace( reLinkCap, '$1$2' ) );
	}
	return false;
}

function createList( context ){
	var i, cap,
		list = [],
		lines = context.$target.val()
			.replace( /<!--[\s\S]+?-->/g, '' )
			.split( /[\r\n]+/ );
	// lines = lines.slice( 1, lines.length - 1 );
	for ( i = 0; i < lines.length; i++) {
		cap = parseLine( lines[ i ] );
		if ( cap ) {
			list.push( cap );
		}
	}
	return list;
}

function createTemplate( context ){
	// <nowiki>
	var list = dedupeList( createList( context ) ),
		predef = '<includeonly>{{{{{|safesubst:}}}Lista de capítulos/{{{1|}}}</includeonly>\n |'
			+ list.join( '\n |' )
			+ '\n<includeonly>}}</includeonly><noinclude>\n'
			+ '{{Documentação|Predefinição:Lista de capítulos/doc}}\n'
			+ '<!-- ADICIONE CATEGORIAS E INTERWIKIS NA SUBPÁGINA /doc -->\n'
			+ '</noinclude>';
	// </nowiki>
	context.$target.val( predef );
}

// Baseado em [[w:en:WP:WikiProject User scripts/Guide/Ajax#Edit a page and other common actions]]
function editPage(page, texto) {
	$.post(
		mw.util.wikiScript( 'api' ), {
			action: 'edit',
			bot: '1',
			title: page,
			text: texto,
			summary: mw.msg( 'bt-create-list-summary', mw.config.get( 'wgBookName' ) ),
			token: mw.user.tokens.get( 'editToken' )
		}
	)
	.done(function() {
		alert( mw.msg( 'bt-page-edited', page.replace( /_/g, ' ' ) ) );
		location.href = mw.util.getUrl( page );
	})
	.fail(function() {
		alert( mw.msg( 'bt-page-not-edited', page.replace( /_/g, ' ' ) ) );
	});
}

function createCollectionPage( context ){
	var i, pos,
		list = dedupeList( createList( context ) ),
		col = '{'+'{Livro gravado\n |título={'
			+'{subst:SUBPAGENAME}}\n |subtítulo=\n |imagem da capa=\n'
			+' |cor da capa=\n}}\n\n== ' + bookName + ' ==\n';
	for ( i = 0; i < list.length; i++ ) {
		pos = list[ i ].lastIndexOf('/') + 1;
		col += ':[[' + bookName + '/' + list[ i ] + '|'
			+ list[ i ].substring( pos ) + ']]\n';
	}
	context.$target.val( col );
}

function createPrintVersion( context ){
	var i, pos,
		// <nowiki>
		list = dedupeList( createList( context ) ),
		imp = '{{Versão para impressão|{{BASEPAGENAME}}|{{BASEPAGENAME}}/Imprimir}}\n';
	for ( i = 0; i < list.length; i++) {
		pos = list[ i ].lastIndexOf('/') + 1;
		imp += '=' + list[ i ].substring( pos )
			+ '=\n{{:{{NOMEDOLIVRO}}/' + list[ i ] + '}}\n';
	}
	imp += '\n{{AutoCat}}';
	// </nowiki>
	context.$target.val( imp );
}

function saveChaptersList( context ){
	var r, listPage = 'Predefinição:Lista_de_capítulos/' + mw.config.get( 'wgPageName' ),
		texto = context.$target.val();
	r = confirm( mw.msg( 'bt-check-list' ) );
	if (r===true) {
		editPage(listPage, texto);
	}
}
function saveCollection( context ){
	var r, collectionPage = 'Wikilivros:Livros/' + mw.config.get( 'wgPageName' ),
		texto = context.$target.val();
	r = confirm( mw.msg( 'bt-check-list-for-collection' ) );
	if (r===true) {
		editPage(collectionPage, texto);
	}
}
function load(){
	pathoschild.TemplateScript.AddWith({
		forActions: 'edit',
		category: mw.msg( 'bt-sidebar-title' )
	},[{
		name: mw.msg( 'bt-create-template-desc' ),
		script: createTemplate
	}, {
		name: mw.msg( 'bt-create-collection-desc' ),
		script: createCollectionPage
	}, {
		name: mw.msg( 'bt-save-collection-desc' ),
		script: saveCollection
	}, {
		name: mw.msg( 'bt-create-print-version-desc' ),
		script: createPrintVersion
	}, {
		name: mw.msg( 'bt-save-list-desc' ),
		script: saveChaptersList
	}, {
		name: mw.msg( 'bt-create-autonav-desc' ),
		script: createAutoNav
	}]);
}

if( mw.config.get( 'wgDBname' ) === 'ptwikibooks' && mw.config.get( 'wgAction' ) === 'edit' && mw.config.get( 'wgNamespaceNumber' ) === 0 ){
	$.getScript( '//tools.wmflabs.org/meta/scripts/pathoschild.templatescript.js', load );
}

}( mediaWiki, jQuery, pathoschild ) );