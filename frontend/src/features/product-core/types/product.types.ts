export interface ReadinessModule {
  id: string;
  title: string;
  route: string;
  status: 'ready' | 'in-progress' | 'planned';
}
