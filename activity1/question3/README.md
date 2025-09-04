
# Atividade 1: Questão 3

Considerando uma base de dados que você pode localizar no Kaggle sobre algum domínio de aplicação específico, por exemplo Saúde (diabetes), Educação (Previsão de evasão e sucesso acadêmico de estudantes), Gestão de Recursos Humanos (IBM HR Analytics Employee Attrition & Performance, sobre predição de rotatividade de funcionários), Agricultura, gere e apresente uma árvore de decisão e as regras correspondentes.
Ao gerar a árvore, realize uma avaliação usando a métrica de acurácia e, caso deseje, apresente outras métricas.

Obs.: Alternativamente, você pode escolher outra base de dados, inclusive de outro repositório.

### Nossa abordagem

Para esta questão, escolhemos o dataset "Higher Education - Predictors of Student Retention" disponível no Kaggle. Este conjunto de dados contém informações detalhadas sobre estudantes do ensino superior, incluindo dados demográficos, socioeconômicos e de desempenho acadêmico. Nosso objetivo é utilizar uma árvore de decisão para prever a retenção dos estudantes com base nesses fatores.

### Sobre o dataset

Este dataset fornece uma visão abrangente dos estudantes matriculados em diversos cursos de graduação oferecidos por uma instituição de ensino superior. Inclui dados demográficos, fatores socioeconômicos e informações de desempenho acadêmico que podem ser usados para analisar possíveis preditores de evasão ou sucesso acadêmico. O dataset contém múltiplos bancos de dados independentes com informações relevantes disponíveis no momento da matrícula, como modo de aplicação, estado civil, curso escolhido e outros. Além disso, os dados podem ser usados para estimar o desempenho geral dos estudantes ao final de cada semestre, avaliando unidades curriculares creditadas/matriculadas/avaliadas/aprovadas, bem como suas respectivas notas. Por fim, há informações sobre taxa de desemprego, inflação e PIB da região, que ajudam a entender como fatores econômicos influenciam a evasão ou o sucesso acadêmico dos estudantes. Esta ferramenta de análise proporciona insights valiosos sobre o que motiva os estudantes a permanecerem na instituição ou abandonarem seus estudos em diversas áreas como agronomia, design, educação, enfermagem, jornalismo, gestão, serviço social ou tecnologias.

#### Como usar o dataset

Este dataset pode ser utilizado para entender e prever a evasão e os resultados acadêmicos dos estudantes. Os dados incluem uma variedade de fatores demográficos, socioeconômicos e de desempenho acadêmico relacionados aos estudantes do ensino superior. O dataset oferece insights valiosos sobre os fatores que afetam o sucesso estudantil e pode orientar intervenções e políticas relacionadas à retenção de estudantes.

Utilizando este dataset, pesquisadores podem investigar duas questões principais:

- Quais fatores preditivos específicos estão ligados à evasão ou conclusão dos estudos?
- Como diferentes características interagem entre si?

Por exemplo, pesquisadores podem explorar se há características demográficas (ex.: gênero, idade na matrícula) ou condições de imersão (ex.: taxa de desemprego na região) associadas a maiores taxas de sucesso estudantil, além de entender as implicações da pobreza nos resultados educacionais. Ao responder essas perguntas, são gerados insights críticos para administradores formularem estratégias que promovam a conclusão bem-sucedida de cursos entre estudantes de diferentes origens em suas instituições.

Para usar este dataset de forma eficaz, é importante que os cientistas se familiarizem com todas as variáveis fornecidas, incluindo variáveis categóricas (ex.: gênero, modo de aplicação), variáveis numéricas (ex.: número de unidades curriculares no início do semestre, idade na matrícula), variáveis ordinais (ex.: estado civil), tendências ao longo do tempo (ex.: taxa de inflação, PIB), variáveis de frequência (ex.: percentual de bolsistas), etc. Além disso, é fundamental estar atento a possíveis vieses presentes nos dados antes de realizar análises — por exemplo, entender se uma população está sub-representada em relação a outra, pois isso pode levar a resultados inesperados se não for considerado. Por fim, é importante notar que este dataset do Kaggle contém informações de apenas um semestre para cada ingresso, enquanto estudos adicionais realizados por períodos mais longos podem fornecer resultados mais precisos sobre o tema devido à deterioração gradual dos coeficientes de retenção obtidos em experimentos de admissões ao longo de diferentes anos.

#### Colunas

| Nome da Coluna                       | Descrição                                                                 |
|--------------------------------------|---------------------------------------------------------------------------|
| Estado civil                         | Estado civil do estudante. (Categórica)                                   |
| Modo de aplicação                    | Método de aplicação utilizado pelo estudante. (Categórica)                |
| Ordem de aplicação                   | Ordem em que o estudante se inscreveu. (Numérica)                         |
| Curso                                | Curso escolhido pelo estudante. (Categórica)                              |
| Turno                                | Se o estudante frequenta aulas diurnas ou noturnas. (Categórica)          |
| Qualificação anterior                | Qualificação obtida antes do ingresso no ensino superior. (Categórica)    |
| Nacionalidade                        | Nacionalidade do estudante. (Categórica)                                  |
| Qualificação da mãe                  | Qualificação da mãe do estudante. (Categórica)                            |
| Qualificação do pai                  | Qualificação do pai do estudante. (Categórica)                            |
| Ocupação da mãe                      | Ocupação da mãe do estudante. (Categórica)                                |
| Ocupação do pai                      | Ocupação do pai do estudante. (Categórica)                                |
| Deslocado                            | Se o estudante é deslocado. (Categórica)                                  |
| Necessidades educacionais especiais  | Se o estudante possui necessidades educacionais especiais. (Categórica)   |
| Devedor                              | Se o estudante é devedor. (Categórica)                                    |
| Mensalidade em dia                   | Se a mensalidade do estudante está em dia. (Categórica)                   |
| Gênero                               | Gênero do estudante. (Categórica)                                         |
| Bolsista                             | Se o estudante é bolsista. (Categórica)                                   |
| Idade na matrícula                   | Idade do estudante ao ingressar. (Numérica)                               |
| Internacional                        | Se o estudante é internacional. (Categórica)                              |
| Unidades curriculares 1º sem (créditos) | Número de unidades curriculares creditadas no 1º semestre. (Numérica)  |
| Unidades curriculares 1º sem (matriculado) | Número de unidades curriculares matriculadas no 1º semestre. (Numérica) |
| Unidades curriculares 1º sem (avaliadas) | Número de unidades curriculares avaliadas no 1º semestre. (Numérica)    |
| Unidades curriculares 1º sem (aprovadas) | Número de unidades curriculares aprovadas no 1º semestre. (Numérica)    |

#### Link do dataset

[https://www.kaggle.com/datasets/thedevastator/higher-education-predictors-of-student-retention](https://www.kaggle.com/datasets/thedevastator/higher-education-predictors-of-student-retention)

### Como executar (neste projeto)

```
python activity1/question3/main.py [--data <csv>] [--max_depth 5] [--no_save]
```

Saídas quando não usa `--no_save` (diretório da questão):
- `tree.txt`, `tree.dot`, `tree.png`
- `metrics_train.csv`, `metrics_test.csv` (classification_report)