package t::MusicBrainz::Server::Controller::Label::DeleteAlias;
use Test::Routine;
use Test::More;
use MusicBrainz::Server::Test qw( html_ok );

with 't::Mechanize', 't::Context';

test all => sub {

my $test = shift;
my $mech = $test->mech;
my $c    = $test->c;

MusicBrainz::Server::Test->prepare_test_database($c, '+controller_cdtoc');

$mech->get_ok('/login');
$mech->submit_form( with_fields => { username => 'new_editor', password => 'password' } );

$mech->get_ok('/label/46f0f4cd-8aab-4b33-b698-f459faf64190/alias/1/delete');
my $response = $mech->submit_form(
    with_fields => {
        'confirm.edit_note' => ''
    });

my $edit = MusicBrainz::Server::Test->get_latest_edit($c);
isa_ok($edit, 'MusicBrainz::Server::Edit::Label::DeleteAlias');
is_deeply($edit->data, {
    entity_id => 2,
    alias_id  => 1,
    name      => 'Test Label Alias',
});

$mech->get_ok('/edit/' . $edit->id, 'Fetch edit page');
html_ok($mech->content, '..valid xml');
$mech->content_contains('Warp Records', '..has label name');
$mech->content_contains('Test Label Alias', '..has alias name');

};

1;
