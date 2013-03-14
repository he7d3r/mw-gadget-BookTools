/**
 * BookTools
 * Adds helper tools to the sidebar for working with books
 * @author: [[User:Helder.wiki]]
 * @tracking: [[Special:GlobalUsage/User:Helder.wiki/Tools/BookTools.js]] ([[File:User:Helder.wiki/Tools/BookTools.js]])
 */
/*jslint browser: true, white: true, plusplus: true, devel: true, regexp: true */
/*global jQuery, mediaWiki, pathoschild */
( function ( mw, $ ) {
'use strict';

var bookName = mw.config.get( 'wgPageName' ).replace(/_/g,' ');

// Adaptação de um script de Paul Galloway (http://www.synergyx.com)
function dedupeList( items ){
	var	i, l,
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
		alert( 'Foram removidas ' + count + ' linhas duplicadas' );
	} else {
		alert( 'Não havia linhas duplicadas' );
	}
	return newlist;
}

function createAutoNav( context ){
	var	list = context.$target.val().split('\n'),
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
	var reLinkCap = new RegExp( '.*\\[\\[\\s*(?:/([^\\|\\]]+?)/?|' +
		$.escapeRE( bookName ) +
		'/([^\\|\\]]+?))\\s*(?:(?:#[^\\|\\]]+?)?\\|\\s*[^\\]]+?\\s*)?\\]\\].*', 'gi' );
	if( reLinkCap.test( line ) ){
		line = line.replace( reLinkCap, '$1$2' ).replace(/^\s+|\s+$/g, '');
	} else {
		line = '';
	}
	return line;
}

function createList( context ){
	var	lines = context.$target.val().split(/[\r\n]+/),
		list = [],
		i, cap;
	lines = lines.slice( 1, lines.length - 1 );
	for ( i = 0; i < lines.length; i++) {
		cap = parseLine( lines[ i ] );
		if ( cap !== '' ) { list.push( cap ); }
	}
	return list;
}

function createTemplate( context ){
	var	list = dedupeList( createList( context ) ),
		predef = '<includeonly>{'+'{{{{|safesubst:}}}Lista de capítulos/{{{1|}}}</includeonly>\n |'
			+ list.join( '\n |' )
			+ '\n<includeonly>}}</includeonly><noinclude>\n'
			+ '{'+'{Documentação|Predefinição:Lista de capítulos/doc}}\n'
			+ '<!-- ADICIONE CATEGORIAS E INTERWIKIS NA SUBPÁGINA /doc -->\n'
			+ '</noinclude>';
	context.$target.val( predef );
}

// Baseado em [[w:en:WP:WikiProject User scripts/Guide/Ajax#Edit a page and other common actions]]
function editPage(pagina, texto) {
	// Edit page (must be done through POST)
	$.post(
		mw.util.wikiScript( 'api' ), {
			action: 'edit',
			bot: '1',
			title: pagina,
			text: texto,
			summary: 'Criação da lista com base no [[' + mw.config.get( 'wgBookName' ) +
				'|índice do livro]] (usando regex)',
			token: mw.user.tokens.get( 'editToken' )
		}
	)
	.done(function() {
		alert('A página "' + pagina.replace(/_/g, ' ') + '" foi editada e será exibida a seguir.');
		location.href = mw.util.wikiGetlink( pagina );
	})
	.fail(function() {
		alert( 'Não foi possível editar a página. =(' );
	});
}// editPage

function createCollectionPage( context ){
	var	list = dedupeList( createList( context ) ), i,
		col = '{'+'{Livro gravado\n |título={'
			+'{subst:SUBPAGENAME}}\n |subtítulo=\n |imagem da capa=\n'
			+' |cor da capa=\n}}\n\n== ' + bookName + ' ==\n';
	for ( i = 0; i < list.length; i++) {
		col += ':[[' + bookName + '/' + list[ i ] + '|'
			+ list[ i ].replace( /^.+\//g, '' ) + ']]\n';
	}
	context.$target.val( col );
}

function createPrintVersion( context ){
	var	list = dedupeList( createList( context ) ), i,
		imp = '{'+'{Versão para impressão|{{BASEPAGENAME}}|{{BASEPAGENAME}}/Imprimir}}\n';
	for ( i = 0; i < list.length; i++) {
		imp += '=' + list[ i ].replace( /^.+\//g, '' )
			+ '=\n{' + '{:{' + '{NOMEDOLIVRO}}/' + list[ i ] + '}}\n';
	}
	imp += '\n{' + '{AutoCat}}';
	context.$target.val( imp );
}

function saveChaptersList( context ){
	var	pagina = 'Predefinição:Lista_de_capítulos/' + mw.config.get( 'wgPageName' ),
		texto = context.$target.val(), r;
		r = confirm('Antes de criar a lista de capítulos é preciso conferir' +
			' se a lista gerada pelo script está correta.\n\nDeseja' +
			' que a lista seja criada com o texto atual?');
	if (r===true) {
		editPage(pagina, texto);
	}
}

function load(){
	pathoschild.TemplateScript.AddWith({
		forActions: 'edit',
		category: 'Gerenciador de livros'
	},[{
		name: 'Gerar lista de capítulos',
		script: createTemplate
	}, {
		name: 'Gerar coleção',
		script: createCollectionPage
	}, {
		name: 'Gerar versão para impressão',
		script: createPrintVersion
	}, {
		name: 'Gravar lista de capítulos (CUIDADO!)',
		script: saveChaptersList
	}, {
		name: 'TEST: Criar AutoNav',
		script: createAutoNav
	}]);
}

if( mw.config.get( 'wgAction' ) === 'edit' && mw.config.get( 'wgNamespaceNumber' ) === 0 ){
	$.getScript( '//pt.wikibooks.org/w/index.php?title=User:Helder.wiki/Tools/Pathoschild/TemplateScript.js&action=raw&ctype=text/javascript&smaxage=21600&maxage=86400', load );
}

}( mediaWiki, jQuery ) );