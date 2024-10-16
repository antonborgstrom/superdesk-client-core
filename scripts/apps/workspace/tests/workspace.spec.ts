
describe('workspace', () => {
    var DESK = 1;

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.dashboard'));
    beforeEach(window.module('superdesk.core.services.pageTitle'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject((session) => {
        session.identity = {_id: 'u1'};
    }));

    beforeEach(inject((desks, $q) => {
        spyOn(desks, 'initialize').and.returnValue($q.when());
        desks.initActive();
        desks.activeDesk = {_id: DESK, name: 'Desk'};
        desks.activeDeskId = DESK;
    }));

    it('can open active workspace', inject(($controller, workspaces, $q, $rootScope) => {
        var workspace = {name: 'foo', widgets: [{_id: 'foo'}]};

        workspaces.active = workspace;
        spyOn(workspaces, 'getActive');

        var ctrl = $controller('DashboardController', {
            dashboardWidgets: [{_id: 'foo', name: 'foo'}],
            $scope: $rootScope.$new(),
        });

        $rootScope.$digest();
        expect(ctrl.current).toBe(null);

        $rootScope.$digest();
        expect(ctrl.current.name).toBe('foo');
        expect(ctrl.widgets.length).toBe(1);
        expect(ctrl.widgets[0].name).toBe('foo');
    }));

    it('can fetch workspaces for current user', (done) => inject((workspaces, api, session, $rootScope) => {
        spyOn(api, 'query').and.returnValue({_items: []});
        session.testUser('foo');

        workspaces.queryUserWorkspaces().then((items) => {
            expect(items).toEqual([]);
            expect(api.query).toHaveBeenCalledWith('workspaces', {where: {user: 'foo'}});

            done();
        });

        $rootScope.$digest();
    }));

    describe('active workspace', () => {
        it('can set active workspace', inject((workspaces, preferencesService) => {
            var active = {_id: 'test'};

            spyOn(preferencesService, 'update');
            workspaces.setActive(active);
            expect(workspaces.active).toBe(active);
            expect(preferencesService.update).toHaveBeenCalled();
        }));

        it('can set active desk',
            inject((workspaces, desks, api, preferencesService, $q, $rootScope) => {
                spyOn(preferencesService, 'update');

                var desk = {_id: 'foo'};

                desks.deskLookup = [];
                desks.deskLookup.foo = desk;
                workspaces.setActiveDesk(desk);
                $rootScope.$digest();

                expect(preferencesService.update).toHaveBeenCalledWith(
                    {'workspace:active': {workspace: 'foo'}},
                    'workspace:active',
                );
            }));

        it('can create workspace', inject((workspaces, session, api, $q, $rootScope) => {
            spyOn(api, 'save').and.returnValue($q.when({_id: 'w1'}));
            session.testUser('foo');
            var workspace = {name: 'test'};

            workspaces.save(workspace);
            $rootScope.$digest();
            expect(workspaces.active._id).toBe('w1');
            expect(api.save).toHaveBeenCalledWith('workspaces', {user: 'foo', name: 'test'});
        }));

        it('can use last active workspace',
            inject((workspaces, api, preferencesService, $q, $rootScope) => {
                var active = {};

                spyOn(preferencesService, 'get').and.returnValue($q.when({workspace: 'w'}));
                spyOn(api, 'find').and.returnValue($q.when(active));
                workspaces.getActive();
                $rootScope.$digest();
                expect(workspaces.active).toBe(active);
                expect(api.find).toHaveBeenCalledWith('workspaces', 'w');
            }));

        it('can create desk workspace if desk is selected but no workspace',
            inject((workspaces, desks, api, preferencesService, $q, $rootScope) => {
                spyOn(preferencesService, 'get').and.returnValue($q.when({workspace: DESK}));
                spyOn(api, 'query').and.returnValue($q.when({_items: []}));
                desks.deskLookup = [];
                desks.deskLookup[DESK] = {_id: DESK};
                workspaces.getActive();
                $rootScope.$digest();
                expect(workspaces.active.desk).toBe(DESK);
                expect(workspaces.active.widgets).toEqual([]);
                expect(api.query).toHaveBeenCalledWith('workspaces', {where: {desk: DESK}});
            }));

        it('can create user workspaces if there is no desk and no workspace',
            inject((workspaces, desks, session, preferencesService, $q, $rootScope) => {
                spyOn(preferencesService, 'get').and.returnValue($q.when(null));
                desks.activeDeskId = null;
                session.testUser('foo');

                workspaces.getActive();
                $rootScope.$digest();

                expect(workspaces.active.desk).toBe(undefined);
                expect(workspaces.active.user).toBe('foo');
            }));
    });
    describe('sdDeskDropdown directive', () => {
        var scope, workspaces;

        beforeEach(inject((desks, _workspaces_, api, preferencesService, $q, $rootScope, $compile) => {
            workspaces = _workspaces_;
            spyOn(desks, 'setCurrentDeskId');
            spyOn(workspaces, 'setActive');
            spyOn(preferencesService, 'update');
            desks.deskLookup = [];
            desks.deskLookup.foo = {_id: 'foo'};
            spyOn(preferencesService, 'get').and.returnValue($q.when({workspace: 'foo'}));
            spyOn(api, 'query').and.returnValue($q.when({_items: []}));

            scope = $rootScope.$new();
            $compile('<div sd-desk-dropdown></div>')(scope);
            scope.$digest();
        }));

        describe('selectDesk() scope method', () => {
            it('selectDesk() set workspace type', inject(() => {
                var desk = {_id: 'foo'};

                scope.workspaceType = null;
                scope.selectDesk(desk);

                expect(scope.workspaceType).toEqual('desk');
            }));
        });

        describe('selectWorkspace() scope method', () => {
            it('selectWorkspace() can set workspace type', inject(() => {
                var workspace = {name: 'foo', widgets: [{_id: 'foo'}]};

                scope.workspaceType = null;
                scope.selectWorkspace(workspace);

                expect(scope.workspaceType).toEqual('workspace');
            }));
        });
    });
});
