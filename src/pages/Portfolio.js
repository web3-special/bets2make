import React from 'react';
import { Container, Col, Row } from 'react-bootstrap';
import MainHeader from '../components/Header';
import ProfitLoss from '../components/ProfitLoss';
import Drawdown from '../components/Drawdown';
import ProfitBy from '../components/ProfitBy';
import MonteCarlo from '../components/MonteCarlo';
import Winning from '../components/Winning';
import SimulateData from '../components/SimulateData';

class Portfolio extends React.Component {
  constructor(props) {
    super(props);

    const portfolioString = localStorage.getItem('portfolioData');
    let portfolioData = [];
    try {
      portfolioData = portfolioString ? JSON.parse(portfolioString) : [];
    } catch (e) {
      console.log('parse error', e);
    }
    this.state = {
      portfolioData,
      selectedId: 0
    };
  }

  onChange = (id, value) => {
    this.setState({ [id]: value });
  };

  onBackResult = () => {
    const { history } = this.props;
    const { state } = history.location;
    if (state) {
      history.push({
        pathname: '/run-simulation',
        state
      });
    } else {
      alert("Sorry, you can't go to simulation page");
      history.push({ pathname: '/' });
    }
  };

  onTableClickRow = row => {
    this.setState({ selectedId: row.id });
  };

  onRemoveFromPortfolio = () => {
    const { portfolioData, selectedId } = this.state;
    if (selectedId !== -1) {
      portfolioData.splice(selectedId, 1);
      this.setState({ portfolioData });
      localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
    } else {
      alert('Please select graph');
    }
  };

  generateChartData = (table, graph) => {
    const { showingMonteDD } = this.state;
    if (table && table.win && graph && graph.length > 0) {
      const cumulativeByYear = {};
      const cumulativeByMonth = {};
      const selectedStrategyBets = [];

      let betResultAccum = 0;
      // let xIndex = 0;
      let newMax = 0;
      let newMin = 0;

      const step = 200;
      const betsCount = table.win + table.loss;
      let betChartStep = betsCount / step;
      let currentBet = 0;
      let realMax = 0;

      const newLine = [];
      const labels = [];
      const newLineDD = [];
      const maxSeries = [];
      const minSeries = [];

      // eslint-disable-next-line
      graph.map(bet => {
        if (bet.betResultValue !== 0) {
          currentBet += 1;
          if (betsCount <= step || currentBet === betsCount) {
            betChartStep = 0;
          }
          betChartStep -= 1;
          const betResult = bet.betResultValue;
          betResultAccum += betResult;

          selectedStrategyBets.push(betResult);

          if (realMax < betResultAccum) {
            realMax = betResultAccum;
          }

          const year = bet.DATE.toString().substring(0, 4);
          const month = bet.DATE.toString().substring(4, 6);
          if (cumulativeByYear[year]) {
            cumulativeByYear[year] += betResult;
          } else {
            cumulativeByYear[year] = betResult;
          }
          if (cumulativeByMonth[month]) {
            cumulativeByMonth[month] += betResult;
          } else {
            cumulativeByMonth[month] = betResult;
          }

          if (betChartStep <= 0) {
            betChartStep = betsCount / step;
            newLine.push(betResultAccum);
            labels.push(currentBet.toString());
            newLineDD.push(betResultAccum - realMax);
            if (newMax < betResultAccum) {
              newMax = betResultAccum;
              maxSeries.push(newMax);
            }
            if (newMin > betResultAccum) {
              newMin = betResultAccum;
              minSeries.push(newMin);
            }
            // xIndex += 1;
          }
        }
      });

      const yearKeys = Object.keys(cumulativeByYear).sort();
      const newYearLine1 = [];
      const newYearLine2 = [];
      // eslint-disable-next-line
      yearKeys.map(each => {
        if (cumulativeByYear[each] > 0) {
          newYearLine1.push(cumulativeByYear[each]);
          newYearLine2.push(0);
        } else {
          newYearLine2.push(cumulativeByYear[each]);
          newYearLine1.push(0);
        }
      });

      const monthKeys = Object.keys(cumulativeByMonth).sort();
      const newMonthLine1 = [];
      const newMonthLine2 = [];
      // eslint-disable-next-line
      monthKeys.map(each => {
        if (cumulativeByMonth[each] > 0) {
          newMonthLine1.push(cumulativeByMonth[each]);
          newMonthLine2.push(0);
        } else {
          newMonthLine2.push(cumulativeByMonth[each]);
          newMonthLine1.push(0);
        }
      });

      const winPercent =
        (table.total_win * 100) / (table.total_win + table.total_loss);
      let profitPercent;

      let monteLabel = [];
      let monteChart = [];
      let monteExtend = [];
      if (table.betsListCnt !== 0) {
        profitPercent =
          (table.amountWins * 100) /
          (table.amountWins + Math.abs(table.amountLoss));
      } else {
        profitPercent = 0;
      }
      if (showingMonteDD) {
        this.showMonteDDGraph(table, graph, selectedStrategyBets, 20, 500);
      } else {
        const result = this.drawMonteChart(
          table,
          graph,
          selectedStrategyBets,
          200,
          50
        );
        monteLabel = result.labels;
        monteChart = result.seriesToPlot;
        monteExtend = result.extendChart;
      }

      return {
        newLine,
        maxSeries,
        newLineDD,
        newYearLine1,
        newYearLine2,
        yearKeys,
        newMonthLine1,
        newMonthLine2,
        monthKeys,
        monteLabel,
        monteChart,
        monteExtend,
        winPercent,
        profitPercent
      };
    } else {
      return {
        newLine: [],
        maxSeries: [],
        newLineDD: [],
        newYearLine1: [],
        newYearLine2: [],
        yearKeys: [],
        newMonthLine1: [],
        newMonthLine2: [],
        monthKeys: [],
        monteLabel: [],
        monteChart: [],
        monteExtend: [],
        winPercent: 0,
        profitPercent: 0
      };
    }
  };

  showMonteDDGraph = (
    strategy,
    graph,
    selectedStrategyBets,
    step,
    testsPerGeneration
  ) => {
    console.log(
      strategy,
      graph,
      selectedStrategyBets,
      step,
      testsPerGeneration
    );
  };

  drawMonteChart = (
    strategy,
    graph,
    selectedStrategyBets,
    step,
    testsPerGeneration
  ) => {
    const seriesToPlot = [];
    const randomList = selectedStrategyBets.slice(0);
    let upperCombination = -2147483648;
    let lowerCombination = 2147483647;
    let currentHigherPeak = -2147483648;
    let currentLowerPeak = 2147483647;
    let upperList = [];
    let lowerList = [];
    let originalList = [];
    const extendChart = [];

    const labels = [];
    labels.push('0');
    for (let i = 0; i < testsPerGeneration; i += 1) {
      const newLine = [];
      let avoidAddLine = false;
      let sumValue = 0;
      const betsCount = strategy.win + strategy.loss;
      const betChartStepSize = step;
      let betChartStep = betsCount / betChartStepSize;
      if (i === 0) {
        originalList = newLine;
        avoidAddLine = true;
      }
      for (let betPos = 0; betPos < randomList.length; betPos += 1) {
        const betResult =
          randomList[Math.floor(Math.random() * randomList.length)];
        if (betsCount <= betChartStepSize || betPos + 1 === betsCount) {
          betChartStep = 0;
        }
        betChartStep -= 1;
        sumValue += betResult;

        if (currentHigherPeak < sumValue) {
          currentHigherPeak = sumValue;
        }
        if (currentLowerPeak > sumValue) {
          currentLowerPeak = sumValue;
        }
        if (betChartStep <= 0) {
          betChartStep = betsCount / betChartStepSize;
          if (i === 0) {
            labels.push((betPos + 1).toString());
          }
          newLine.push(sumValue);
        }
      }

      if (currentHigherPeak > upperCombination) {
        upperCombination = currentHigherPeak;
        upperList = newLine;
        avoidAddLine = true;
      }
      if (currentLowerPeak < lowerCombination) {
        lowerCombination = currentLowerPeak;
        lowerList = newLine;
        avoidAddLine = true;
      }
      if (!avoidAddLine) {
        seriesToPlot.push(newLine);
      }
    }
    if (lowerList !== originalList && lowerList !== upperList) {
      extendChart.push({ data: lowerList, color: '#FF00FF' });
    }
    if (upperList !== originalList) {
      extendChart.push({ data: upperList, color: '#0000FF' });
    }
    extendChart.push({ data: originalList, color: '#00FF00' });
    return { labels, seriesToPlot, extendChart };
  };

  render() {
    const { history } = this.props;
    const { state } = history.location;
    const { portfolioData, selectedId } = this.state;
    const {
      newLine,
      maxSeries,
      newLineDD,
      newYearLine1,
      newYearLine2,
      yearKeys,
      newMonthLine1,
      newMonthLine2,
      monthKeys,
      winPercent,
      profitPercent,
      monteLabel,
      monteChart,
      monteExtend
    } = this.generateChartData(
      portfolioData[selectedId],
      portfolioData[selectedId].betsList
    );

    return (
      <Container className="pageContainer">
        <MainHeader menus={[true, true, false]} history={history} />
        <Row>
          <Col lg={6}>
            <ProfitLoss newLine={newLine} maxSeries={maxSeries} />
            <Drawdown newLineDD={newLineDD} />
            <ProfitBy
              newYearLine1={newYearLine1}
              newYearLine2={newYearLine2}
              yearKeys={yearKeys}
              newMonthLine1={newMonthLine1}
              newMonthLine2={newMonthLine2}
              monthKeys={monthKeys}
            />
          </Col>
          <Col lg={6}>
            <MonteCarlo
              monteLabel={monteLabel}
              monteChart={monteChart}
              monteExtend={monteExtend}
            />
            <Winning winPercent={winPercent} profitPercent={profitPercent} />
          </Col>
        </Row>
        <SimulateData
          data={portfolioData}
          portfolio
          showBackButton={!!state}
          onBackResult={this.onBackResult}
          onRemove={this.onRemoveFromPortfolio}
          onTableClickRow={this.onTableClickRow}
          selected={selectedId}
        />
      </Container>
    );
  }
}

export default Portfolio;
